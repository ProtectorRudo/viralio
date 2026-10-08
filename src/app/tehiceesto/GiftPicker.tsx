"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { experiences, type Experience } from "./data";
import { formatTeHiceEstoPrice } from "./pricing";

const GIFTS:Record<string,{label:string;subtitle:string;artline:string}>={
  pareja:{label:"Para tu pareja",subtitle:"Las pequeñas cosas que hacen única su historia.",artline:"Un amor que merece su propio lugar"},
  mama:{label:"Para mamá",subtitle:"Todo eso que hizo por vos y merece escuchar.",artline:"Gracias por estar siempre"},
  cumpleanos:{label:"Cumpleaños",subtitle:"Una sorpresa distinta para celebrar su día.",artline:"Un año más para recordar"},
  papa:{label:"Para papá",subtitle:"Las huellas que dejó sin darse cuenta.",artline:"Hay cosas que quedan"},
  hijos:{label:"Para tu hijo/a",subtitle:"Una historia para guardar y volver a sentir.",artline:"Desde que llegaste"},
  abuelos:{label:"Para abuelos",subtitle:"Una vida de momentos que merecen permanecer.",artline:"Toda una vida en recuerdos"},
  amistad:{label:"Para una amistad",subtitle:"El archivo secreto de todo lo que compartieron.",artline:"Para nuestras historias"},
  aniversario:{label:"Aniversario",subtitle:"Celebrar lo que construyeron día a día.",artline:"Todo lo que construimos"},
  propuesta:{label:"Propuesta",subtitle:"Una forma inolvidable de llegar a la pregunta.",artline:"Antes de preguntarte algo"},
};
const RECIPIENTS=[
  {id:"pareja",name:"Mi pareja",symbol:"♡"},
  {id:"mama",name:"Mamá",symbol:"✿"},
  {id:"papa",name:"Papá",symbol:"◇"},
  {id:"cumpleanos",name:"Cumpleaños",symbol:"✧"},
  {id:"hijos",name:"Mi hijo/a",symbol:"☼"},
  {id:"abuelos",name:"Abuelos",symbol:"⌛"},
  {id:"amistad",name:"Un amigo/a",symbol:"☆"},
  {id:"otros",name:"Otras ocasiones",symbol:"∞"},
];
const RANK=["pareja","mama","cumpleanos","papa","hijos","abuelos","amistad","aniversario","propuesta"];

function GiftPhoto({experience,accent=false}:{experience:Experience;accent?:boolean}){
  const photo=experience.demo.photos?.[0];
  return <div className={`thi-buy-photo ${accent?"hero-photo":""}`}
    style={photo?{"--gift-photo":`url("${photo.url}")`,"--gift-position":photo.position||"center"} as CSSProperties:undefined}>
    <div className="thi-buy-photo-glaze"/>
    <span className="thi-buy-photo-monogram" aria-hidden="true">{experience.icon}</span>
    <span className="thi-buy-photo-note">{GIFTS[experience.slug]?.artline||"Una historia especial"}</span>
  </div>;
}

function SmallSymbol({children}:{children:ReactNode}){return <span className="thi-buy-symbol" aria-hidden="true">{children}</span>}

export default function GiftPicker({selectedSlug,onSelect,onContinue}:{selectedSlug:string;onSelect:(slug:string)=>void;onContinue:()=>void}){
  const [category,setCategory]=useState("all");
  const chosen=experiences.find(item=>item.slug===selectedSlug);
  const pareja=experiences.find(item=>item.slug==="pareja")!;
  const mama=experiences.find(item=>item.slug==="mama")!;
  const visible=useMemo(()=>{
    const sorted=[...experiences].sort((a,b)=>RANK.indexOf(a.slug)-RANK.indexOf(b.slug));
    if(category==="all")return sorted;
    if(category==="otros")return sorted.filter(item=>["aniversario","propuesta"].includes(item.slug));
    if(category==="pareja")return sorted.filter(item=>["pareja","aniversario","propuesta"].includes(item.slug));
    return sorted.filter(item=>item.slug===category);
  },[category]);

  return <div className={`thi-buy-picker ${chosen?"has-choice":""}`}>
    <section className="thi-buy-hero" aria-labelledby="thi-buy-title">
      <div className="thi-buy-hero-copy">
        <span className="thi-buy-eyebrow">TE HICE ESTO · REGALOS QUE SE VIVEN</span>
        <h1 id="thi-buy-title">Hay regalos que se abren.<br/><em>Y otros que se sienten.</em></h1>
        <p>Elegí a alguien especial. Transformamos tus fotos, audios y palabras en un recorrido digital que sorprende, emociona y se guarda.</p>
        <a className="thi-buy-discover" href="#gift-occasion">Encontrá su regalo <span aria-hidden="true">↓</span></a>
        <div className="thi-buy-hero-qualities" aria-label="Qué incluye">
          <span><SmallSymbol>♡</SmallSymbol> Hecho personal</span>
          <span><SmallSymbol>✦</SmallSymbol> Digital y privado</span>
          <span><SmallSymbol>∞</SmallSymbol> Para recordar</span>
        </div>
      </div>
      <div className="thi-buy-hero-visual" aria-hidden="true">
        <div className="thi-buy-photo-stack photo-back"><GiftPhoto experience={mama}/></div>
        <div className="thi-buy-photo-stack photo-front"><GiftPhoto experience={pareja} accent/></div>
        <div className="thi-buy-hero-paper">Un lugar para<br/><i>todo lo que sentimos.</i><b>♡</b></div>
        <i className="thi-buy-hero-spark spark-one">✧</i><i className="thi-buy-hero-spark spark-two">✦</i>
      </div>
      <div className="thi-buy-price-card">
        <small>UNA EXPERIENCIA COMPLETA</small>
        <strong>{formatTeHiceEstoPrice()}</strong>
        <span>Pago único, sin suscripción</span>
      </div>
    </section>

    <div className="thi-buy-how" aria-label="Cómo funciona">
      <div className="thi-buy-how-intro"><span>ASÍ DE SIMPLE</span><strong>De tu corazón a su pantalla.</strong></div>
      <div className="thi-buy-how-steps">
        <span><b>01</b> Elegís</span><i>→</i>
        <span><b>02</b> Pagás</span><i>→</i>
        <span><b>03</b> Personalizás</span><i>→</i>
        <span><b>04</b> Regalás</span>
      </div>
    </div>

    <section className="thi-buy-occasion" id="gift-occasion" aria-labelledby="thi-buy-occasion-title">
      <div className="thi-buy-section-head">
        <span className="thi-buy-eyebrow">PRIMERO, PENSEMOS EN ESA PERSONA</span>
        <h2 id="thi-buy-occasion-title">¿A quién querés <em>sorprender?</em></h2>
        <p>Elegí una opción para encontrar su experiencia. Podés cambiarla cuando quieras.</p>
      </div>
      <div className="thi-buy-recipient-grid" role="group" aria-label="Filtrar por destinatario">
        {RECIPIENTS.map(item=><button key={item.id} type="button"
          className={category===item.id?"is-active":""}
          aria-pressed={category===item.id}
          onClick={()=>{setCategory(current=>current===item.id?"all":item.id);}}>
          <span aria-hidden="true">{item.symbol}</span><strong>{item.name}</strong>
        </button>)}
      </div>
    </section>

    <section className="thi-buy-collection" id="gift-selection-list" aria-labelledby="thi-buy-list-title">
      <div className="thi-buy-collection-heading">
        <div><span className="thi-buy-eyebrow">LA COLECCIÓN</span><h2 id="thi-buy-list-title">{category==="all"?"Una experiencia para cada historia.":category==="otros"?"Otros momentos inolvidables.":`Pensado para ${RECIPIENTS.find(x=>x.id===category)?.name.toLowerCase()||"esa persona"}.`}</h2></div>
        {category!=="all"&&<button type="button" onClick={()=>setCategory("all")}>Ver todas las experiencias ↗</button>}
      </div>
      <div className="thi-buy-card-grid">
        {visible.map((gift,index)=>{
          const active=selectedSlug===gift.slug;
          return <article key={gift.slug} className={`thi-buy-gift-card ${active?"is-selected":""}`}>
            <Link className="thi-buy-gift-art-link" href={`/tehiceesto/experiencias/${gift.slug}`} target="_blank" rel="noopener" aria-label={`Ver experiencia ${gift.title}`}>
              <GiftPhoto experience={gift}/>
              <span className="thi-buy-art-number">TH / {String(RANK.indexOf(gift.slug)+1).padStart(2,"0")}</span>
            </Link>
            <div className="thi-buy-gift-info">
              <div className="thi-buy-gift-topline"><span>{GIFTS[gift.slug]?.label||gift.eyebrow}</span>{active&&<b>✓ ELEGIDO</b>}</div>
              <h3>{gift.title}</h3>
              <p>{GIFTS[gift.slug]?.subtitle||gift.short}</p>
              <div className="thi-buy-gift-benefits"><span>✧ Fotos</span><span>♫ Audios</span><span>♡ Sorpresas</span></div>
              <div className="thi-buy-gift-actions">
                <button type="button" className="thi-buy-select" aria-pressed={active}
                  onClick={()=>onSelect(gift.slug)}>
                  {active?"Regalo elegido":"Elegir este regalo"} <span aria-hidden="true">{active?"✓":"→"}</span>
                </button>
                <Link href={`/tehiceesto/experiencias/${gift.slug}`} target="_blank" rel="noopener" className="thi-buy-preview">
                  <span aria-hidden="true">▷</span> Ver la sorpresa
                </Link>
              </div>
            </div>
          </article>;
        })}
      </div>
      {category!=="all"&&<button className="thi-buy-view-all" type="button" onClick={()=>setCategory("all")}>Explorar todos los regalos <span>→</span></button>}
    </section>

    <section className="thi-buy-reassurance">
      <span className="thi-buy-eyebrow">MÁS QUE UNA PÁGINA</span>
      <h2>Un regalo que sigue <em>emocionando.</em></h2>
      <div>
        <article><span>✧</span><strong>Una experiencia real</strong><p>Cada demo muestra el recorrido, los efectos y las sorpresas que recibirá esa persona.</p></article>
        <article><span>♡</span><strong>Tu historia, sus detalles</strong><p>Agregás tus nombres, fotos, audios y palabras sin tener que diseñar nada.</p></article>
        <article><span>♧</span><strong>Íntimo y privado</strong><p>Se comparte mediante un enlace privado para regalar cuando vos elijas.</p></article>
      </div>
    </section>

    {chosen&&<div className="thi-buy-selection-dock" role="region" aria-label="Tu regalo elegido">
      <div className="thi-buy-dock-gift">
        <div className="thi-buy-dock-thumb"><GiftPhoto experience={chosen}/></div>
        <div><small>TU REGALO ELEGIDO</small><strong>{chosen.title}</strong><button type="button" onClick={()=>{
          document.getElementById("gift-occasion")?.scrollIntoView({behavior:"smooth",block:"start"});
        }}>Cambiar regalo</button></div>
      </div>
      <div className="thi-buy-dock-checkout">
        <span>Pago único <b>{formatTeHiceEstoPrice()}</b></span>
        <button type="button" onClick={onContinue}>Continuar con mis datos <i aria-hidden="true">→</i></button>
      </div>
    </div>}
  </div>;
}
