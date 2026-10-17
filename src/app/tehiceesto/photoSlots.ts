/* Personal photo placement: reusable by every frozen and live gift model.
 * Store only authorized media IDs and CSS crop settings, never signed URLs.
 * Apply after each version's original photo-fill algorithm to preserve all effects. */
export type PhotoSlotChoice={mediaId:string;fit:"cover"|"contain";position:string};
export type PhotoSlots=Record<string,PhotoSlotChoice>;
export type UploadedPhoto={id:string;url:string|null;caption?:string|null};
export type DisplayPhoto={url:string;scene?:string;caption?:string;fit?:"cover"|"contain";position?:string};

const validPosition=(value:string)=>value==="center"||value==="top"||value==="bottom"||value==="left"||value==="right"||/^(100|\d{1,2})% (100|\d{1,2})%$/.test(value);
export function safePhotoSlots(input:unknown):PhotoSlots{
  if(!input||typeof input!=="object"||Array.isArray(input))return {};
  const out:PhotoSlots={};
  for(const [key,value] of Object.entries(input).slice(0,160)){
    if(!/^[a-z][a-z0-9-]{1,32}:(?:[0-9]|1[0-9])$/.test(key)||!value||typeof value!=="object"||Array.isArray(value))continue;
    const v=value as Record<string,unknown>;
    if(typeof v.mediaId!=="string"||!v.mediaId||v.mediaId.length>80)continue;
    const position=typeof v.position==="string"&&validPosition(v.position)?v.position:"center";
    out[key]={mediaId:v.mediaId,fit:v.fit==="contain"?"contain":"cover",position};
  }
  return out;
}
export function applyPhotoSlotChoices<T extends DisplayPhoto>(
  photos:readonly T[],uploaded:readonly UploadedPhoto[],input:unknown,
):T[]{
  const choices=safePhotoSlots(input);
  const available=new Map(uploaded.filter(item=>item.id&&item.url).map(item=>[item.id,item]));
  const slots=new Map<string,number>();
  return photos.map(photo=>{
    const scene=photo.scene||"memories";
    const slot=slots.get(scene)||0;
    slots.set(scene,slot+1);
    const choice=choices[`${scene}:${slot}`];
    const source=choice?available.get(choice.mediaId):undefined;
    return source?.url?{
      ...photo,url:source.url,caption:source.caption||undefined,
      fit:choice.fit,position:choice.position,
    } as T:photo;
  });
}
