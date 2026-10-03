"use client";

import { useMemo, useState } from "react";
import ExperienceEngine from "./ExperienceEngine";
import { experiences, getExperience } from "./data";

const stepMeta = [
  { num:"01", label:"El momento" },
  { num:"02", label:"Ustedes" },
  { num:"03", label:"Tus palabras" },
  { num:"04", label:"Preview" },
];

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
  const personalized=useMemo(()=>({
    ...base,
    demoGiver:giver||"Alguien que te quiere",
    demoRecipient:recipient||"Vos",
    opening:opening||base.opening,
    closing:closing||base.closing
  }),[base,giver,recipient,opening,closing]);

  if(preview) return <div className="thi-preview-overlay">
    <button className="thi-preview-close" onClick={()=>setPreview(false)}>← Volver a editar</button>
    <ExperienceEngine experience={personalized}/>
  </div>;

  return <div className="thi-wizard-shell">
    <aside className="thi-wizard-aside">
      <a href="/tehiceesto" className="thi-wizard-brand">TE HICE ESTO <span>♥</span></a>
      <div className="thi-wizard-aside-copy">
        <p className="thi-kicker">Crear una experiencia</p>
        <h2>No estás completando una plantilla.</h2>
        <p>Estás dándonos las primeras piezas para construir algo que sólo puede pertenecerles a ustedes.</p>
      </div>

      <div className="thi-wizard-summary" style={{"--summary-accent":base.accent} as React.CSSProperties}>
        <span className="thi-summary-icon">{base.icon}</span>
        <div>
          <small>{base.eyebrow}</small>
          <strong>{base.title}</strong>
          <p>{recipient ? `Para ${recipient}` : "Todavía sin destinatario"}</p>
        </div>
      </div>

      <div className="thi-wizard-privacy">
        <span>◌</span>
        <div><strong>Privado desde el inicio</strong><small>Esta prueba pública no publica nada ni guarda archivos personales.</small></div>
      </div>
    </aside>

    <div className="thi-wizard thi-wizard-premium">
      <div className="thi-wizard-topline">
        <div className="thi-wizard-steps">
          {stepMeta.map((item,index)=><button key={item.num} className={index===step?"active":index<step?"done":""} onClick={()=>index<step&&setStep(index)}>
            <span>{index<step?"✓":item.num}</span><small>{item.label}</small>
          </button>)}
        </div>
        <small className="thi-wizard-count">{step+1} / 4</small>
      </div>

      <div className="thi-wizard-progress"><span style={{width:`${((step+1)/4)*100}%`}}/></div>

      <div className="thi-wizard-stage" key={step}>
        {step===0&&<section>
          <p className="thi-kicker">01 · Elegí el momento</p>
          <h1>¿Qué querés convertir en algo inolvidable?</h1>
          <p className="thi-wizard-intro">Cada opción cambia el recorrido, el tono y las interacciones. Elegí la que más se parece a lo que querés hacer sentir.</p>
          <div className="thi-choice-grid thi-choice-grid-premium">{experiences.map(x=><button key={x.slug} className={experience===x.slug?"selected":""} style={{"--choice-accent":x.accent} as React.CSSProperties} onClick={()=>setExperience(x.slug)}>
            <span className="thi-choice-icon">{x.icon}</span>
            <div><strong>{x.title}</strong><small>{x.eyebrow}</small></div>
            <i>{experience===x.slug?"✓":"→"}</i>
          </button>)}</div>
          <div className="thi-wizard-actions single"><button className="thi-primary thi-primary-premium" onClick={()=>setStep(1)}><span>Continuar</span><b>→</b></button></div>
        </section>}

        {step===1&&<section>
          <p className="thi-kicker">02 · Ustedes</p>
          <h1>¿Quién hace esto y para quién?</h1>
          <p className="thi-wizard-intro">Los nombres aparecen dentro de la experiencia. Es el primer detalle que hace que deje de sentirse genérica.</p>
          <div className="thi-form-grid thi-form-grid-premium">
            <label><span>Tu nombre</span><input value={giver} onChange={e=>setGiver(e.target.value)} placeholder="Ej. Mauro"/><small>Quien está preparando la sorpresa</small></label>
            <label><span>Nombre de quien lo recibe</span><input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Ej. Ailín"/><small>La persona para la que existe este lugar</small></label>
          </div>
          <p className="thi-field-title">¿Qué querés que sienta primero?</p>
          <div className="thi-feelings thi-feelings-premium">{["Emoción","Amor","Sorpresa","Diversión","Nostalgia"].map((x,index)=><button key={x} className={feeling===x?"selected":""} onClick={()=>setFeeling(x)}><span>{["🥹","♥","✦","☺","◌"][index]}</span>{x}</button>)}</div>
          <div className="thi-wizard-actions"><button className="thi-ghost" onClick={()=>setStep(0)}>← Atrás</button><button className="thi-primary" disabled={!giver.trim()||!recipient.trim()} onClick={()=>setStep(2)}>Seguir →</button></div>
        </section>}

        {step===2&&<section>
          <p className="thi-kicker">03 · Tus palabras</p>
          <h1>Ahora aparece lo que sólo vos podés decir.</h1>
          <p className="thi-wizard-intro">No hace falta escribir perfecto. Las mejores frases suelen sonar exactamente como vos hablás.</p>
          <label className="thi-bigfield thi-bigfield-premium"><span>La primera frase</span><textarea rows={4} value={opening} onChange={e=>setOpening(e.target.value)} placeholder={base.opening}/><small>Es lo primero que va a leer después de entrar.</small></label>
          <label className="thi-bigfield thi-bigfield-premium"><span>La última frase</span><textarea rows={4} value={closing} onChange={e=>setClosing(e.target.value)} placeholder={base.closing}/><small>La frase que queremos que le quede resonando al final.</small></label>
          <div className="thi-wizard-actions"><button className="thi-ghost" onClick={()=>setStep(1)}>← Atrás</button><button className="thi-primary" onClick={()=>setStep(3)}>Ver resumen →</button></div>
        </section>}

        {step===3&&<section className="thi-review">
          <p className="thi-kicker">04 · Preview</p>
          <h1>Esto ya empieza a parecerse a {recipient}.</h1>
          <p className="thi-wizard-intro">Todavía faltan las fotos, los audios y los detalles de la historia. Pero ya podés sentir el tono y recorrer la experiencia.</p>

          <div className="thi-review-card thi-review-card-premium" style={{"--review-accent":base.accent} as React.CSSProperties}>
            <div className="thi-review-aura"/>
            <span>{base.icon}</span>
            <div>
              <small>{base.eyebrow}</small>
              <strong>{base.title}</strong>
              <p>De <b>{giver}</b> para <b>{recipient}</b> · queremos provocar {feeling.toLowerCase()}.</p>
            </div>
            <i>PRIVATE PREVIEW</i>
          </div>

          <div className="thi-review-details">
            <article><span>✦</span><div><strong>Recorrido distinto</strong><small>{base.recipe.length} escenas pensadas para esta ocasión.</small></div></article>
            <article><span>◌</span><div><strong>Falta tu material real</strong><small>Fotos, carta, audios y videos se incorporan después.</small></div></article>
            <article><span>♥</span><div><strong>Antes de entregar, se revisa</strong><small>El regalo final se previsualiza completo antes de publicarlo.</small></div></article>
          </div>

          <div className="thi-wizard-actions"><button className="thi-ghost" onClick={()=>setStep(2)}>← Seguir editando</button><button className="thi-primary thi-primary-premium" onClick={()=>setPreview(true)}><span>Vivir mi preview</span><b>▶</b></button></div>
        </section>}
      </div>
    </div>
  </div>;
}
