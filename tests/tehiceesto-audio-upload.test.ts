import {describe,it,expect} from "vitest";
import {AudioUploadError,encodeVoiceWav,prepareCompatibleAudio,recognizeAudioHeader} from "../src/app/tehiceesto/audioUpload";

describe("Customer audio compatibility",()=>{
  it("recognizes real media signatures, not unreliable WhatsApp MIME labels",()=>{
    const bytes=(text:string)=>new TextEncoder().encode(text);
    expect(recognizeAudioHeader(bytes("OggS"+String.fromCharCode(0).repeat(20)))).toBe("ogg");
    expect(recognizeAudioHeader(bytes("RIFF0000WAVEfmt "))).toBe("wav");
    expect(recognizeAudioHeader(bytes("ID3"+String.fromCharCode(0).repeat(16)))).toBe("mp3");
    expect(recognizeAudioHeader(bytes("0000ftypM4A "))).toBe("mp4");
    expect(recognizeAudioHeader(new Uint8Array([0x1a,0x45,0xdf,0xa3,0,0,0,0,0,0,0,0]))).toBe("webm");
    expect(recognizeAudioHeader(bytes("not a music file"))).toBe("unknown");
  });
  it("creates a standards-compliant 24kHz mono WAV header from a voice note",async()=>{
    const wav=encodeVoiceWav([new Float32Array(48000).fill(0.5)],48000);
    const bytes=await wav.arrayBuffer();
    const view=new DataView(bytes);
    expect(wav.type).toBe("audio/wav");
    expect(String.fromCharCode(...new Uint8Array(bytes.slice(0,4)))).toBe("RIFF");
    expect(String.fromCharCode(...new Uint8Array(bytes.slice(8,12)))).toBe("WAVE");
    expect(view.getUint32(24,true)).toBe(24000);
    expect(view.getUint16(22,true)).toBe(1);
    expect(view.getUint16(34,true)).toBe(16);
    expect(view.getUint32(40,true)).toBe(48000);
    expect(bytes.byteLength).toBe(48044);
    expect(view.getInt16(44,true)).toBeGreaterThan(16000);
  });
  it("decodes a real Ogg Opus WhatsApp-style voice note with a generic MIME label",async()=>{
    // 160 ms synthetic 440 Hz voice fixture (FFmpeg/libopus; no customer data).
    const base64="T2dnUwACAAAAAAAAAADuSu0oAAAAAD4R8Z0BE09wdXNIZWFkAQE4AYA+AAAAAABPZ2dTAAAAAAAAAAAAAO5K7SgBAAAAtj5YhAE9T3B1c1RhZ3MMAAAATGF2ZjYxLjcuMTAzAQAAAB0AAABlbmNvZGVyPUxhdmM2MS4xOS4xMDEgbGlib3B1c09nZ1MABDgfAAAAAAAA7krtKAIAAACdyyljCRgYFRUQFg8SDwiC4jRFRViX9UFWDFbbe5bAZyYxz2LmjAijQOf/L/yPMySS7/si2mMe5di8DLGYsAidSG6ze/qKV4f8EMBO8PWmKbWg8AickCvjTlp4HoAbTE00pCUK7ocfgAickCvjTlp6/Kr2ykeqwFwInJd44IdWfRmcmKDZ4jwo38mV6p1gCJyQK+NOWnsDEhAsNgaACJyQK+NOWnsEhjDmAf16i9egCAZhasEuUBDrOpYwYojA";
    const data=Uint8Array.from(atob(base64),letter=>letter.charCodeAt(0));
    const voice=new File([data],"PTT-2026-10-09-WA0001.opus",{type:"application/octet-stream"});
    const normalized=await prepareCompatibleAudio(voice);
    expect(normalized.name).toBe("PTT-2026-10-09-WA0001.wav");
    expect(normalized.type).toBe("audio/wav");
    const header=new Uint8Array(await normalized.slice(0,12).arrayBuffer());
    expect(recognizeAudioHeader(header)).toBe("wav");
    expect(normalized.size).toBeGreaterThan(1000);
  });
  it("rejects empty and inconsistent audio rather than storing a broken gift",()=>{
    expect(()=>encodeVoiceWav([],48000)).toThrow(AudioUploadError);
    expect(()=>encodeVoiceWav([new Float32Array(3),new Float32Array(2)],48000)).toThrow(AudioUploadError);
    expect(()=>encodeVoiceWav([new Float32Array(100)],0)).toThrow(AudioUploadError);
  });
});
