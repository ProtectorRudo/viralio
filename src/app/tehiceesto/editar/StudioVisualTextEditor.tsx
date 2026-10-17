"use client";

import { useEffect,useMemo,useState } from "react";
import { creatorCall } from "../creatorApi";

export type StudioSceneTextOverrides=Record<string,Record<string,string>>;
type Selection={scene:string;source:string;current:string};

function textNodeAtPoint(x:number,y:number){
  const doc=document as Document&{
    caretRangeFromPoint?:(x:number,y:number)=>Range|null;
    caretPositionFromPoint?:(x:number,y:number)=>{offsetNode:Node;offset:number}|null;
  };
  const position=doc.caretPositionFromPoint?.(x,y);
  if(position?.offsetNode?.nodeType===Node.TEXT_NODE)return position.offsetNode as Text;
  const range=doc.caretRangeFromPoint?.(x,y);
  return range?.startContainer?.nodeType===Node.TEXT_NODE?range.startContainer as Text:null;
}

function firstTextNode(element:Element|null){
  if(!element)return null;
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
  let node=walker.nextNode();
  while(node){
    if((node.textContent||"").trim())return node as Text;
    node=walker.nextNode();
  }
  return null;
}

export default function StudioVisualTextEditor({
  code,editorToken,initialOverrides,onChange,
}:{
  code:string;
  editorToken:string;
  initialOverrides:StudioSceneTextOverrides;
  onChange:(value:StudioSceneTextOverrides)=>void;
}){
  const [selection,setSelection]=useState<Selection|null>(null);
  const [value,setValue]=useState("");
  const [saving,setSaving]=useState(false);
  const [overrides,setOverrides]=useState(initialOverrides);
  const [message,setMessage]=useState("");

  const count=useMemo(
    ()=>Object.values(overrides).reduce((sum,scene)=>sum+Object.keys(scene).length,0),
    [overrides],
  );

  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      const target=event.target as Element|null;
      if(!target||target.closest(".studio-copy-tools,.studio-photo-modal-backdrop"))return;
      const root=document.querySelector<HTMLElement>(".studio-preview-stage .thi-experience");
      if(!root||!root.contains(target))return;
      // Keep scene navigation, gifts, photos and interactive gestures usable.
      // Those controls should not be hijacked by the always-on text selector.
      if(target.closest("button,a,[role=button],input,select,textarea,label,img,picture,video,audio,.thi-progress,.thi-scene-meta,.thi-reset-journey,.soundtrack-control,.thi-attached-photo,[class*='-photo'],[class*='photo-'],[class*='-portrait'],[class*='portrait-'],[class*='-frame'],[class*='frame-']"))return;

      const textNode=textNodeAtPoint(event.clientX,event.clientY)
        ||firstTextNode(target.closest("button,h1,h2,h3,p,small,strong,span,em,b"));
      const visible=(textNode?.textContent||"").trim();
      const scene=root.dataset.scene||"";
      if(!visible||!scene)return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const sceneOverrides=overrides[scene]||{};
      const source=Object.entries(sceneOverrides).find(([,replacement])=>replacement===visible)?.[0]||visible;
      setSelection({scene,source,current:sceneOverrides[source]??visible});
      setValue(sceneOverrides[source]??visible);
      setMessage("");
    };

    document.addEventListener("click",onClick,true);
    return()=>document.removeEventListener("click",onClick,true);
  },[overrides]);

  async function save(){
    if(!selection||!value.trim())return;
    setSaving(true);setMessage("");
    try{
      const result=await creatorCall<{sceneContent:StudioSceneTextOverrides}>("saveStudioSceneText",{
        code,editorToken,scene:selection.scene,source:selection.source,replacement:value.trim(),
      });
      const next=result.sceneContent||{};
      setOverrides(next);onChange(next);setSelection(null);setMessage("Guardado ✓ Podés editar otra frase cuando quieras.");
    }catch{
      setMessage("No se pudo guardar. Probá otra vez.");
    }finally{setSaving(false)}
  }

  async function restore(){
    if(!selection)return;
    setSaving(true);setMessage("");
    try{
      const result=await creatorCall<{sceneContent:StudioSceneTextOverrides}>("restoreStudioSceneText",{
        code,editorToken,scene:selection.scene,source:selection.source,
      });
      const next=result.sceneContent||{};
      setOverrides(next);onChange(next);setSelection(null);setMessage("Restaurado ✓ La edición de textos sigue disponible.");
    }catch{
      setMessage("No se pudo restaurar.");
    }finally{setSaving(false)}
  }

  return <div className="studio-copy-tools">
    <div className="studio-copy-toggle active studio-copy-always-active" role="status" aria-label="Edición de textos siempre activada">
      <span aria-hidden="true">Aa</span>
      <div>
        <small>EDICIÓN DE TEXTOS SIEMPRE ACTIVA{count>0?` · ${count} PERSONALIZADOS`:""}</small>
        <strong>Tocá cualquier frase para editarla</strong>
        <span className="studio-copy-description">Guardá y seguí recorriendo. Los botones y las fotografías funcionan normalmente.</span>
      </div>
      <b aria-hidden="true">✓</b>
    </div>

    {selection&&<div className="studio-copy-sheet">
      <div className="studio-copy-sheet-head">
        <div><small>ESTÁS CAMBIANDO</small><strong>Una frase de esta parte</strong></div>
        <button type="button" onClick={()=>setSelection(null)} aria-label="Cerrar">×</button>
      </div>
      <p className="studio-copy-original">{selection.source}</p>
      <textarea rows={5} value={value} onChange={event=>setValue(event.target.value)} autoFocus/>
      <div className="studio-copy-actions">
        <button type="button" onClick={restore} disabled={saving}>Usar la original</button>
        <button type="button" className="primary" onClick={save} disabled={saving||!value.trim()}>
          {saving?"Guardando…":"Guardar y seguir"}
        </button>
      </div>
    </div>}

    {message&&<span className="studio-copy-message">{message}</span>}
  </div>;
}
