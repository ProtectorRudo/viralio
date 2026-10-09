/** Bundled Ogg/Opus decoder by Ethan Halsall (MIT), wasm-audio-decoders. */
export type DecodedOggOpus={
  channelData:Float32Array[];
  sampleRate:number;
  samplesDecoded:number;
  errors:Array<{message:string}>;
};
export class OggOpusDecoder {
  constructor(options?:Record<string,unknown>);
  ready:Promise<void>;
  decodeFile(input:Uint8Array):Promise<DecodedOggOpus>;
  free():void;
}