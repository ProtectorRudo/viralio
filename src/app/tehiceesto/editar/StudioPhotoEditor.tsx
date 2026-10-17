/* eslint-disable @next/next/no-img-element */
"use client";

import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import {createPortal} from "react-dom";
import {creatorCall} from "../creatorApi";
import {type PhotoSlots,type PhotoSlotChoice} from "../photoSlots";
import {PRIVATE_PHOTO_SLOTS} from "../privateGiftVisuals";

type Photo={id:string;url:string;caption:string;fit?:"cover"|"contain";position?:string;scene?:string};
type Editing={scene:string;slot:number;maxSlots:number;mediaId:string;fit:"cover"|"contain";x:number;y:number};
const limit=(n:number)=>Math.min(100,Math.max(0,Math.round(n)));
function coords(position:string|undefined){
  if(position==="top")return {x:50,y:0};
  if(position==="bottom")return {x:50,y:100};
  if(position==="left")return {x:0,y:50};
  if(position==="right")return {x:100,y:50};
  const found=/^(\d{1,3})% (\d{1,3})%$/.exec(position||"");
  return found?{x:limit(Number(found[1])),y:limit(Number(found[2]))}:{x:50,y:50};
}
function photoSource(element:Element,root:Element):string{
  let node:Element|null=element;
  for(let n=0;node&&node!==root&&n<7;n++,node=node.parentElement){
    if(node instanceof HTMLImageElement)return node.currentSrc||node.src;
    if(!(node instanceof HTMLElement))continue;
    const background=getComputedStyle(node).backgroundImage;
    const found=/url\(["']?(.+?)["']?\)/.exec(background);
    if(found?.[1]&&!found[1].startsWith("data:"))return found[1];
  }
  return "";
}
export default function StudioPhotoEditor({
  code,editorToken,scene,media,slots,enabled,onToggle,onSaved,
}:{
  code:string;editorToken:string;scene:string;media:Photo[];
  slots:PhotoSlots;enabled:boolean;onToggle:()=>void;onSaved:(slots:PhotoSlots)=>void;
}){
  const [editing,setEditing]=useState<Editing|null>(null);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const dragRef=useRef<{x:number;y:number;startX:number;startY:number}|null>(null);
  useEffect(()=>{
    if(!enabled||!media.length)return;
    const onClick=(event:MouseEvent)=>{
      const root=document.querySelector(".studio-preview-stage .thi-experience");
      const target=event.target instanceof Element?event.target:null;
      if(!root||!target||!root.contains(target)||target.closest(".studio-photo-editor,.thi-progress,.thi-global-back-nav,.thi-reset-journey,.soundtrack-control,.thi-attached-audio,audio,video"))return;
      const source=photoSource(target,root);
      if(!source)return;
      const selected=media.find(item=>item.url===source);
      // Generic illustrations and demo-only images are not editable photographs.
      // Do not mistake a scene-wide decorative background for a selectable photo.
      if(!selected && !target.closest("img,.origin-photo,.childhood-photo,[class*='-photo'],[class*='photo-'],[class*='-portrait'],[class*='portrait-'],[class*='-frame'],[class*='frame-']"))return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      const possible=[...root.querySelectorAll("img,[style*='backgroundImage'],[style*='background-image']")]
        .filter(node=>{const url=photoSource(node,root);return !!url&&(media.some(photo=>photo.url===url)||url===source)});
      const clicked=target.closest("img,[style*='backgroundImage'],[style*='background-image']")||target;
      const index=Math.max(0,possible.findIndex(node=>node===clicked));
      const slotCount=scene==="memories"
        ?Math.min(20,Math.max(3,possible.length))
        :Math.min(20,PRIVATE_PHOTO_SLOTS[scene]||Math.max(1,possible.length));
      // Some scenes mirror the same image in a large card and a small thumbnail.
      // Both controls must edit the same underlying slot, not a phantom image.
      const slot=Math.min(19,index%slotCount);
      const current=slots[scene+":"+slot];
      const chosen=media.find(photo=>photo.id===current?.mediaId)||selected||media[0];
      const position=coords(current?.position||chosen.position);
      setEditing({scene,slot,maxSlots:slotCount,mediaId:chosen.id,fit:current?.fit||chosen.fit||"cover",...position});
      setError("");
    };
    document.addEventListener("click",onClick,true);
    return()=>document.removeEventListener("click",onClick,true);
  },[enabled,scene,media,slots]);
  useEffect(()=>{
    if(!editing)return;
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"&&!saving)setEditing(null)};
    document.addEventListener("keydown",escape);
    return()=>document.removeEventListener("keydown",escape);
  },[editing,saving]);
  const selected=editing?media.find(photo=>photo.id===editing.mediaId):undefined;
  const setPart=(patch:Partial<Editing>)=>setEditing(value=>value?{...value,...patch}:value);
  async function save(){
    if(!editing||!editorToken||saving)return;
    setSaving(true);setError("");
    const key=editing.scene+":"+editing.slot;
    const nextChoice:PhotoSlotChoice={mediaId:editing.mediaId,fit:editing.fit,position:`${editing.x}% ${editing.y}%`};
    try{
      const result=await creatorCall<{photoSlots:PhotoSlots}>("saveStudioPhotoSlot",{
        code,editorToken,scene:editing.scene,slot:editing.slot,...nextChoice,
      });
      onSaved(result.photoSlots||{...slots,[key]:nextChoice});
      setEditing(null);
    }catch{setError("No pudimos guardar el encuadre. Probá nuevamente.")}
    finally{setSaving(false)}
  }
  function dragStart(event:ReactPointerEvent<HTMLDivElement>){
    if(!editing||editing.fit==="contain")return;
    dragRef.current={x:event.clientX,y:event.clientY,startX:editing.x,startY:editing.y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function dragMove(event:ReactPointerEvent<HTMLDivElement>){
    if(!editing||!dragRef.current)return;
    const rect=event.currentTarget.getBoundingClientRect();
    const dx=(event.clientX-dragRef.current.x)/Math.max(rect.width,1)*100;
    const dy=(event.clientY-dragRef.current.y)/Math.max(rect.height,1)*100;
    setPart({x:limit(dragRef.current.startX-dx),y:limit(dragRef.current.startY-dy)});
  }
  return <section className="studio-photo-tools" aria-label="Edición directa de fotografías">
    <button type="button" className={enabled?"studio-photo-mode active":"studio-photo-mode"} onClick={onToggle}>
      <span aria-hidden="true">▧</span><strong>{enabled?"Edición de fotos activada":"Elegir y encuadrar fotos"}</strong>
      <small>{enabled?"Tocá una foto de la vista previa":"Tocá para habilitar la edición"}</small>
    </button>
    {enabled&&<p className="studio-photo-tip">Tocá cualquier foto del recorrido para reemplazarla por otra de tu galería, desplazar el encuadre o mostrarla completa. La elección se guarda solo para ese lugar.</p>}
    {editing&&createPortal(<div className="studio-photo-modal-backdrop" role="presentation" onPointerDown={event=>{if(event.target===event.currentTarget&&!saving)setEditing(null)}}>
      <div className="studio-photo-modal" role="dialog" aria-modal="true" aria-labelledby="studio-photo-modal-title">
        <div className="studio-photo-modal-heading">
          <div><small>PERSONALIZAR LA IMAGEN</small><h2 id="studio-photo-modal-title">Elegí el recuerdo perfecto</h2></div>
          <button type="button" onClick={()=>setEditing(null)} disabled={saving} aria-label="Cerrar editor de fotografía">✕</button>
        </div>
        <label className="studio-photo-slot-choice"><span>Espacio de esta escena</span>
          <select value={editing.slot} onChange={event=>{const slot=Number(event.target.value);const existing=slots[editing.scene+":"+slot];const match=media.find(m=>m.id===existing?.mediaId);const pos=coords(existing?.position||match?.position);setPart({slot,mediaId:match?.id||editing.mediaId,fit:existing?.fit||match?.fit||"cover",...pos})}}>
            {Array.from({length:editing.maxSlots},(_,i)=><option key={i} value={i}>{i===0?"Foto principal":`Foto ${i+1}`}</option>)}
          </select>
        </label>
        <div className="studio-photo-crop-viewport" onPointerDown={dragStart} onPointerMove={dragMove}
          onPointerUp={()=>{dragRef.current=null}} onPointerCancel={()=>{dragRef.current=null}}
          aria-label="Arrastrá la imagen para acomodar las caras dentro del marco">
          {selected&&<img src={selected.url} alt={selected.caption||"Foto seleccionada"} draggable={false} style={{objectFit:editing.fit,objectPosition:`${editing.x}% ${editing.y}%`}}/>}
          <span> {editing.fit==="contain"?"Foto completa":"Deslizá para encuadrar"} </span>
        </div>
        <div className="studio-photo-crop-controls">
          <div className="studio-photo-fit-actions">
            <button type="button" className={editing.fit==="cover"?"selected":""} onClick={()=>setPart({fit:"cover"})}>Llenar marco</button>
            <button type="button" className={editing.fit==="contain"?"selected":""} onClick={()=>setPart({fit:"contain",x:50,y:50})}>Foto completa</button>
          </div>
          <label>Horizontal <strong>{editing.x}%</strong><input type="range" min={0} max={100} value={editing.x} onChange={event=>setPart({x:Number(event.target.value)})}/></label>
          <label>Vertical <strong>{editing.y}%</strong><input type="range" min={0} max={100} value={editing.y} onChange={event=>setPart({y:Number(event.target.value)})}/></label>
        </div>
        <p className="studio-photo-library-title">Elegí una foto de las que subiste</p>
        <div className="studio-photo-library">
          {media.map(item=><button type="button" key={item.id} className={item.id===editing.mediaId?"selected":""}
            aria-label={`Usar foto ${item.caption||item.id}`} aria-pressed={item.id===editing.mediaId}
            onClick={()=>{const crop=coords(item.position);setPart({mediaId:item.id,fit:item.fit||"cover",...crop})}}>
            <img src={item.url} alt={item.caption||"Recuerdo"}/></button>)}
        </div>
        {error&&<p role="alert" className="studio-photo-error">{error}</p>}
        <div className="studio-photo-modal-footer">
          <button type="button" onClick={()=>setEditing(null)} disabled={saving}>Cancelar</button>
          <button type="button" onClick={()=>void save()} disabled={saving}>{saving?"Guardando…":"Guardar esta foto ✓"}</button>
        </div>
      </div>
    </div>,document.body)}
  </section>;
}
