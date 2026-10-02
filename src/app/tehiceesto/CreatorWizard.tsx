"use client";

import { useMemo, useState } from "react";
import ExperienceEngine from "./ExperienceEngine";
import { experiences, getExperience } from "./data";

export default function CreatorWizard(){
  const [step,setStep]=useState(0);
  const [experience,setExperience]=useState("pareja");
  const [giver,setGiver]=useState("");
  const [recipient,setRecipient]=useState("");
  const [feeling,setFeeling]=useState("Emoción");
  const [opening,setOpening]=useState("");
  const [closing,setClosing]=useState("");
  const [preview,setPreview]=useState(false);

  const base=getExperience(experience)||experiences[0];
  const personalized=useMemo(()=>({...base,demoGiver:giver||"Alguien que te quiere",demoRecipient:recipient||"Vos",opening:opening||base.opening,closing:closing||base.closing}),[base,giver,recipient,opening,closing]);

  if(preview) return <div className="thi-preview-overlay"><button className="thi-preview-close" onClick={()=>setPreview(false)}>← Volver a editar</button><ExperienceEngine experience={personalized}/></div>;

  return <div className="thi-wizard">
    <div className="thi-wizard-progress"><span style={{width:`${((step+1)/4)*100}%`}}/></div>
    {step===0&&<section><p className="thi-kicker">01 · Elegí el momento</p><h1>¿Qué querés convertir en algo inolvidable?</h1><div className="thi-choice-grid">{experiences.map(x=><button key={x.slug} className={experience===x.slug?"selected":""} onClick={()=>setExperience(x.slug)}><span>{x.icon}</span><div><strong>{x.title}</strong><small>{x.eyebrow}</small></div></button>)}</div><button className="thi-primary" onClick={()=>setStep(1)}>Continuar</button></section>}
    {step===1&&<section><p className="thi-kicker">02 · Ustedes</p><h1>¿Quién hace esto y para quién?</h1><div className="thi-form-grid"><label><span>Tu nombre</span><input value={giver} onChange={e=>setGiver(e.target.value)} placeholder="Ej. Mauro"/></label><label><span>Nombre de quien lo recibe</span><input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Ej. Ailín"/></label></div><p className="thi-field-title">¿Qué querés que sienta?</p><div className="thi-feelings">{["Emoción","Amor","Sorpresa","Diversión","Nostalgia"].map(x=><button key={x} className={feeling===x?"selected":""} onClick={()=>setFeeling(x)}>{x}</button>)}</div><div className="thi-wizard-actions"><button className="thi-ghost" onClick={()=>setStep(0)}>Atrás</button><button className="thi-primary" disabled={!giver.trim()||!recipient.trim()} onClick={()=>setStep(2)}>Seguir</button></div></section>}
    {step===2&&<section><p className="thi-kicker">03 · Tus palabras</p><h1>Ahora aparece lo que sólo vos podés decir.</h1><label className="thi-bigfield"><span>Primera frase · opcional</span><textarea rows={4} value={opening} onChange={e=>setOpening(e.target.value)} placeholder={base.opening}/></label><label className="thi-bigfield"><span>Última frase · opcional</span><textarea rows={4} value={closing} onChange={e=>setClosing(e.target.value)} placeholder={base.closing}/></label><div className="thi-wizard-actions"><button className="thi-ghost" onClick={()=>setStep(1)}>Atrás</button><button className="thi-primary" onClick={()=>setStep(3)}>Ver resumen</button></div></section>}
    {step===3&&<section className="thi-review"><p className="thi-kicker">04 · Preview</p><h1>Esto ya empieza a parecerse a {recipient}.</h1><div className="thi-review-card"><span>{base.icon}</span><div><small>{base.eyebrow}</small><strong>{base.title}</strong><p>De {giver} para {recipient} · {feeling.toLowerCase()}</p></div></div><p className="thi-review-note">Esta versión pública muestra el flujo. La carga real de fotos, audios y videos se hace desde nuestro panel interno.</p><div className="thi-wizard-actions"><button className="thi-ghost" onClick={()=>setStep(2)}>Seguir editando</button><button className="thi-primary" onClick={()=>setPreview(true)}>Vivir mi preview</button></div></section>}
  </div>;
}
