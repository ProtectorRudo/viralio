"use client";

import Link from "next/link";
import { type CSSProperties } from "react";
import { experiences, type Experience } from "./data";
import { formatTeHiceEstoPrice } from "./pricing";

const ORDER=["pareja","mama","cumpleanos","papa","hijos","abuelos","amistad","aniversario","propuesta"];
const LABELS:Record<string,string>={
  pareja:"Para tu pareja",
  mama:"Para mamá",
  cumpleanos:"Cumpleaños",
  papa:"Para papá",
  hijos:"Para tu hijo/a",
  abuelos:"Para abuelos",
  amistad:"Para una amistad",
  aniversario:"Aniversario",
  propuesta:"Propuesta",
};

function GiftImage({gift}:{gift:Experience}){
  const photo=gift.demo.photos?.[0];
  return <div className="thi-simple-image" style={photo?{
    "--simple-image":`url("${photo.url}")`,
    "--simple-position":photo.position||"center",
  } as CSSProperties:undefined}>
    <span className="thi-simple-image-mark" aria-hidden="true">{gift.icon}</span>
  </div>;
}

/** One action per item: select and go directly to the contact/payment form. */
export default function GiftPicker({onSelect}:{onSelect:(slug:string)=>void}){
  const all=[...experiences].sort((a,b)=>ORDER.indexOf(a.slug)-ORDER.indexOf(b.slug));
  return <div className="thi-simple-picker">
    <header className="thi-simple-intro">
      <div>
        <span className="thi-buy-eyebrow">01 · ELEGÍ TU REGALO</span>
        <h1>¿A quién querés <em>sorprender?</em></h1>
        <p>Elegí una experiencia y seguí con tus datos. La personalizás después de pagar.</p>
      </div>
      <div className="thi-simple-price">
        <strong>{formatTeHiceEstoPrice()}</strong>
        <small>Pago único · todas las experiencias</small>
      </div>
    </header>

    <div className="thi-simple-catalog" aria-label="Experiencias disponibles">
      {all.map(gift=><article key={gift.slug} className="thi-simple-card">
        <Link className="thi-simple-photo-link" href={`/tehiceesto/experiencias/${gift.slug}`}
          target="_blank" rel="noopener noreferrer" aria-label={`Ver muestra de ${gift.title}`}>
          <GiftImage gift={gift}/>
        </Link>
        <div className="thi-simple-card-content">
          <span className="thi-simple-card-label">{LABELS[gift.slug]||gift.eyebrow}</span>
          <h2>{gift.title}</h2>
          <p>{gift.short}</p>
          <div className="thi-simple-actions">
            <button type="button" className="thi-simple-choose" onClick={()=>onSelect(gift.slug)}>
              Elegir y continuar <span aria-hidden="true">→</span>
            </button>
            <Link href={`/tehiceesto/experiencias/${gift.slug}`} target="_blank" rel="noopener noreferrer"
              className="thi-simple-preview">Ver muestra <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </article>)}
    </div>
    <p className="thi-simple-footer-note">♡ Cada regalo incluye su recorrido, efectos y animaciones. Vos agregás las fotos, audios y palabras.</p>
  </div>;
}
