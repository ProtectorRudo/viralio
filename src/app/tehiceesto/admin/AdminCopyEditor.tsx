/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect,useMemo,useState } from "react";
import { adminCall } from "./api";
import type { SceneTextOverrides } from "../sceneText";

type Selection={scene:string;source:string;current:string};

function textNodeAtPoint(x:number,y:number){
  const doc=document as Document&{
    caretRangeFromPoint?:(x:number,y:number)=>Range|null;
    caretPositionFromPoint?:(x:number,y:number)=>{offsetNode:Node;offset:number}|null;
  };
  const position=doc.caretPositionFromPoint?.(x,y);
  if(position?.offsetNode?.nodeType===Node.TEXT_NODE)return position.offsetNode as Text;
  const range=doc.caretRangeFromPoint?.(x,y);
  if(range?.startContainer?.nodeType===Node.TEXT_NODE)return range.startContainer as Text;
  return null;
}

function firstTextNode(element:Element|null){
  if(!element)return null;
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
  let node=walker.nextNode();
  while(node){if((node.textContent||"").trim())return node as Text;node=walker.nextNode()}
  return null;
}

export default function AdminCopyEditor({
  code,initialOverrides,onChange,
}:{
  code:string;
  initialOverrides:SceneTextOverrides;
  onChange?:(value:SceneTextOverrides)=>void;
}){
  const [enabled,setEnabled]=useState(false);
  const [selection,setSelection]=useState<Selection|null>(null);
  const [value,setValue]=useState("");
  const [saving,setSaving]=useState(false);
  const [overrides,setOverrides]=useState(initialOverrides);

  const count=useMemo(
    ()=>Object.values(overrides).reduce((sum,scene)=>sum+Object.keys(scene).length,0),
    [overrides],
  );

  useEffect(()=>{
    document.documentElement.classList.toggle("copy-editing",enabled);
    return()=>document.documentElement.classList.remove("copy-editing");
  },[enabled]);

  useEffect(()=>{
    if(!enabled)return;
    const onClick=(event:MouseEvent)=>{
      const target=event.target as Element|null;
      if(!target||target.closest(".admin-copy-editor"))return;
      const root=document.querySelector<HTMLElement>(".thi-experience");
      if(!root||!root.contains(target))return;
      if(target.closest(".thi-progress,.thi-scene-meta,.thi-reset-journey,.soundtrack-control"))return;

      const textNode=textNodeAtPoint(event.clientX,event.clientY)||
        firstTextNode(target.closest("button,h1,h2,h3,p,small,strong,span,em,b"));
      const visible=(textNode?.textContent||"").trim();
      if(!visible)return;
      const scene=root.dataset.scene||"";
      if(!scene)return;

      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      const sceneOverrides=overrides[scene]||{};
      const source=Object.entries(sceneOverrides).find(([,replacement])=>replacement===visible)?.[0]||visible;
      const current=sceneOverrides[source]??visible;
      setSelection({scene,source,current});setValue(current);
    };
    document.addEventListener("click",onClick,true);
    return()=>document.removeEventListener("click",onClick,true);
  },[enabled,overrides]);

  async function save(){
    if(!selection)return;setSaving(true);
    try{
      const result=await adminCall<{sceneContent:SceneTextOverrides}>("saveSceneCopyOverride",{
        code,scene:selection.scene,source:selection.source,replacement:value,
      });
      const next=result.sceneContent||{};
      setOverrides(next);onChange?.(next);setSelection(null);
    }finally{setSaving(false)}
  }

  async function restore(){
    if(!selection)return;setSaving(true);
    try{
      const result=await adminCall<{sceneContent:SceneTextOverrides}>("removeSceneCopyOverride",{
        code,scene:selection.scene,source:selection.source,
      });
      const next=result.sceneContent||{};
      setOverrides(next);onChange?.(next);setSelection(null);
    }finally{setSaving(false)}
  }

  return <div className="admin-copy-editor">
    <button type="button" className={enabled?"copy-editor-toggle active":"copy-editor-toggle"} onClick={()=>{setEnabled(v=>!v);setSelection(null)}}>
      <span>{enabled?"✦":"Aa"}</span><div><small>{count?`${count} personalizados`:"Edición visual"}</small><strong>{enabled?"Tocá cualquier texto":"Editar textos"}</strong></div>
    </button>
    {enabled&&!selection&&<div className="copy-editor-hint"><strong>Modo edición activo</strong><p>Tocá cualquier frase visible. Para avanzar o revelar una interacción, desactivá este modo y volvé a activarlo después.</p></div>}
    {selection&&<div className="copy-editor-panel">
      <div className="copy-editor-panel-head"><div><small>ESCENA · {selection.scene}</small><strong>Editar texto</strong></div><button type="button" onClick={()=>setSelection(null)} aria-label="Cerrar">×</button></div>
      <label><span>Texto original</span><p>{selection.source}</p></label>
      <label><span>Texto personalizado</span><textarea rows={5} value={value} onChange={e=>setValue(e.target.value)} autoFocus/></label>
      <div className="copy-editor-actions"><button type="button" className="copy-reset" onClick={restore} disabled={saving}>Restaurar original</button><button type="button" className="copy-save" onClick={save} disabled={saving}>{saving?"Guardando…":"Guardar cambio"}</button></div>
    </div>}
  </div>;
}
