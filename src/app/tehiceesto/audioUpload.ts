/**
 * Prepare customer voice notes for playback on mobile browsers.
 * WhatsApp normally shares Ogg/Opus. We decode it locally with bundled WASM,
 * then upload universally playable PCM WAV; the raw voice never visits a
 * third-party transcoding service. MP3/M4A/WAV are preserved losslessly.
 */
export class AudioUploadError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "AudioUploadError";
  }
}
export type AudioHeader = "ogg"|"mp3"|"mp4"|"wav"|"webm"|"unknown";
const MAX_SIZE = 50*1024*1024;
const MAX_TRANSCODE_SECONDS = 14*60;
const WAVE_RATE = 24000;
const textAt = (bytes: Uint8Array, at: number, text: string) =>
  [...text].every((letter,i) => bytes[at+i] === letter.charCodeAt(0));

export function recognizeAudioHeader(bytes: Uint8Array): AudioHeader {
  if (bytes.length<12) return "unknown";
  if (textAt(bytes,0,"OggS")) return "ogg";
  if (textAt(bytes,0,"RIFF") && textAt(bytes,8,"WAVE")) return "wav";
  if (textAt(bytes,0,"ID3") || (bytes[0]===0xff && (bytes[1]&0xe0)===0xe0)) return "mp3";
  if (textAt(bytes,4,"ftyp")) return "mp4";
  if (bytes[0]===0x1a && bytes[1]===0x45 && bytes[2]===0xdf && bytes[3]===0xa3) return "webm";
  return "unknown";
}

/** Encode mono 16-bit 24 kHz PCM suitable for Safari, Chrome and Firefox. */
export function encodeVoiceWav(channels: Float32Array[], sourceRate: number): Blob {
  const length = channels[0]?.length||0;
  const duration = length/sourceRate;
  if (!channels.length || channels.some(channel=>channel.length!==length)
    || !Number.isFinite(duration) || duration<=0) {
    throw new AudioUploadError("empty_audio","Ese archivo no contiene un audio válido.");
  }
  if (duration>MAX_TRANSCODE_SECONDS) {
    throw new AudioUploadError("duration","El audio es muy largo. Elegí uno de hasta 14 minutos.");
  }
  const samples = Math.ceil(duration*WAVE_RATE);
  const bytes = 44+samples*2;
  if (bytes>MAX_SIZE) throw new AudioUploadError("size","El audio es demasiado largo para subirlo.");
  const buffer = new ArrayBuffer(bytes);
  const view = new DataView(buffer);
  function writeWord(offset:number, value:string) {
    for(let i=0;i<value.length;i++) view.setUint8(offset+i,value.charCodeAt(i));
  }
  writeWord(0,"RIFF"); view.setUint32(4,bytes-8,true);
  writeWord(8,"WAVE"); writeWord(12,"fmt ");
  view.setUint32(16,16,true); view.setUint16(20,1,true);
  view.setUint16(22,1,true); view.setUint32(24,WAVE_RATE,true);
  view.setUint32(28,WAVE_RATE*2,true); view.setUint16(32,2,true);
  view.setUint16(34,16,true); writeWord(36,"data");
  view.setUint32(40,samples*2,true);
  const scale = sourceRate/WAVE_RATE;
  for(let i=0;i<samples;i++){
    const position = Math.min((length-1),i*scale);
    const base=Math.floor(position),next=Math.min(length-1,base+1),fraction=position-base;
    let sample=0;
    for(const channel of channels) sample+=(channel[base]*(1-fraction)+channel[next]*fraction);
    sample=Math.max(-1,Math.min(1,sample/channels.length));
    view.setInt16(44+i*2,sample<0?Math.round(sample*32768):Math.round(sample*32767),true);
  }
  return new Blob([buffer],{type:"audio/wav"});
}

async function decodeWithBrowser(file: File): Promise<{channelData:Float32Array[];sampleRate:number}> {
  const AudioContextCtor=window.AudioContext||(window as Window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!AudioContextCtor) throw new Error("no_audio_decoder");
  const context=new AudioContextCtor();
  try {
    const decoded=await context.decodeAudioData(await file.arrayBuffer());
    return {channelData:Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i)),sampleRate:decoded.sampleRate};
  } finally {await context.close().catch(()=>{});}
}
async function decodeWhatsAppOpus(file:File){
  const {OggOpusDecoder}=await import("./vendor/oggOpusDecoder");
  const decoder=new OggOpusDecoder();
  try{
    await decoder.ready;
    const result=await decoder.decodeFile(new Uint8Array(await file.arrayBuffer()));
    if(result.errors.length || result.samplesDecoded<=0) throw new Error("opus_corrupted");
    return {channelData:result.channelData,sampleRate:result.sampleRate};
  }finally {decoder.free();}
}
async function verifyBrowserPlayback(file:File){
  const url=URL.createObjectURL(file);
  const audio=document.createElement("audio");
  audio.preload="metadata";
  try{
    await new Promise<void>((resolve,reject)=>{
      let finished=false;
      const done=(error?:Error)=>{
        if(finished)return;
        finished=true;window.clearTimeout(timer);
        audio.removeEventListener("loadedmetadata",onLoaded);
        audio.removeEventListener("error",onError);
        if(error)reject(error);else resolve();
      };
      const onLoaded=()=>done(Number.isNaN(audio.duration) || audio.duration<=0?new Error("invalid_duration"):undefined);
      const onError=()=>done(new Error("decode_error"));
      const timer=window.setTimeout(()=>done(new Error("metadata_timeout")),12000);
      audio.addEventListener("loadedmetadata",onLoaded);
      audio.addEventListener("error",onError);
      audio.src=url; audio.load();
    });
  } finally {audio.removeAttribute("src");audio.load();URL.revokeObjectURL(url);}
}

export async function prepareCompatibleAudio(file:File):Promise<File>{
  if(file.size<=0) throw new AudioUploadError("empty_audio","El audio está vacío. Volvé a elegirlo.");
  if(file.size>MAX_SIZE) throw new AudioUploadError("size","El audio supera los 50 MB. Elegí uno más liviano.");
  const initial=new Uint8Array(await file.slice(0,4096).arrayBuffer());
  const detected=recognizeAudioHeader(initial);
  if(detected==="unknown"){
    throw new AudioUploadError("format","No pudimos reconocer el audio. Elegí una nota de voz de WhatsApp, MP3, M4A, WAV o WebM.");
  }
  if(detected==="ogg"||detected==="webm"){
    const hasOpusHead=detected==="ogg" && new TextDecoder().decode(initial).includes("OpusHead");
    try {
      const decoded=hasOpusHead?await decodeWhatsAppOpus(file):await decodeWithBrowser(file);
      const wav=encodeVoiceWav(decoded.channelData,decoded.sampleRate);
      const name=(file.name.replace(/\.[^.]+$/,"")||"nota-de-voz")+".wav";
      return new File([wav],name,{type:"audio/wav",lastModified:file.lastModified});
    }catch(error){
      if(error instanceof AudioUploadError)throw error;
      throw new AudioUploadError("conversion","No pudimos preparar esa nota de voz. Probá reenviarla desde WhatsApp o grabarla acá mismo.");
    }
  }
  const type=detected==="mp3"?"audio/mpeg":detected==="mp4"?"audio/mp4":"audio/wav";
  const ext=detected==="mp3"?"mp3":detected==="mp4"?"m4a":"wav";
  const name=(file.name.replace(/\.[^.]+$/,"")||"audio")+"."+ext;
  const typed=new File([file],name,{type,lastModified:file.lastModified});
  try{await verifyBrowserPlayback(typed);}
  catch{throw new AudioUploadError("playback","El teléfono no logra reproducir ese audio. Probá guardarlo otra vez o grabarlo desde acá.");}
  return typed;
}
