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
  const [enabled,setEnabled]=useState(false);
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
    document.documentElement.classList.toggle("studio-copy-editing",enabled);
    return()=>document.documentElement.classList.remove("studio-copy-editing");
  },[enabled]);

  useEffect(()=>{
    if(!enabled)return;
    const onClick=(event:MouseEvent)=>{
      const target=event.target as Element|null;
      if(!target||target.closest(".studio-copy-tools"))return;
      const root=document.querySelector<HTMLElement>(".studio-preview-stage .thi-experience");
      if(!root||!root.contains(target))return;
      if(target.closest(".thi-progress,.thi-scene-meta,.thi-reset-journey,.soundtrack-control,audio,video"))return;

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
  },[enabled,overrides]);

  async function save(){
    if(!selection||!value.trim())return;
    setSaving(true);setMessage("");
    try{
      const result=await creatorCall<{sceneContent:StudioSceneTextOverrides}>("saveStudioSceneText",{
        code,editorToken,scene:selection.scene,source:selection.source,replacement:value.trim(),
      });
      const next=result.sceneContent||{};
      setOverrides(next);onChange(next);setSelection(null);setEnabled(false);setMessage("Listo ✓ Ya podés seguir recorriendo.");
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
      setOverrides(next);onChange(next);setSelection(null);setEnabled(false);setMessage("Listo ✓ Volvimos al original y ya podés seguir.");
    }catch{
      setMessage("No se pudo restaurar.");
    }finally{setSaving(false)}
  }

  return <div className="studio-copy-tools">
    <button
      type="button"
      className={enabled?"studio-copy-toggle active":"studio-copy-toggle"}
      onClick={()=>{setEnabled(current=>!current);setSelection(null);setMessage("")}}
    >
      <span>{enabled?"✓":"Aa"}</span>
      <div>
        <small>{enabled?"MODO EDICIÓN ACTIVO":count?(count===1?"1 TEXTO CAMBIADO":count+" TEXTOS CAMBIADOS"):"PERSONALIZÁ ESTA PARTE"}</small>
        <strong>{enabled?"Ahora tocá una frase":"Editar textos"}</strong>
        <p>{enabled?"Elegí dentro del regalo la frase que querés cambiar.":"Tocá acá y después elegí cualquier texto de esta parte para cambiarlo."}</p>
      </div>
      <b aria-hidden="true">{enabled?"✓":"→"}</b>
    </button>

    {enabled&&!selection&&<div className="studio-copy-hint">
      <strong>Tocá el texto que querés cambiar.</strong>
      <p>Cuando guardes el cambio, el recorrido se habilita solo.</p>
      <button type="button" className="studio-copy-done" onClick={()=>{setEnabled(false);setMessage("Listo. Seguí recorriendo el regalo →")}}>Listo, seguir recorriendo →</button>
    </div>}

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
