"use client";

import Link from "next/link";
import { type CSSProperties } from "react";
import { experiences, type Experience } from "./data";
import { formatTeHiceEstoPrice } from "./pricing";

/**
 * The catalogue is an immediate purchase choice, not an extra wizard.
 * Never introduce a second "confirm selection" action here.
 */
const ORDER=["pareja","mama","cumpleanos","papa","hijos","abuelos","amistad","aniversario","propuesta"] as const;

const GIFT_STYLE:Record<string,{recipient:string;badge:string;symbol:string;tint:string;accent:string;ink:string;line:string}>={
  pareja:{recipient:"Para tu pareja",badge:"PARA TU PAREJA",symbol:"♥",tint:"#f7e4e5",accent:"#9c4053",ink:"#ffffff",line:"#d9a6aa"},
  mama:{recipient:"Para mamá",badge:"PARA MAMÁ",symbol:"✿",tint:"#fae9de",accent:"#b16b52",ink:"#ffffff",line:"#e1b8a2"},
  cumpleanos:{recipient:"Cumpleaños",badge:"PARA UN CUMPLEAÑOS",symbol:"✦",tint:"#fff1da",accent:"#a87522",ink:"#ffffff",line:"#e4c38c"},
  papa:{recipient:"Para papá",badge:"PARA PAPÁ",symbol:"✧",tint:"#e5edf4",accent:"#496783",ink:"#ffffff",line:"#a8c3d6"},
  hijos:{recipient:"Para tu hijo/a",badge:"PARA TU HIJO/A",symbol:"♡",tint:"#e6f0e5",accent:"#577d65",ink:"#ffffff",line:"#b2cbbb"},
  abuelos:{recipient:"Para abuelos",badge:"PARA ABUELOS",symbol:"♧",tint:"#eee6f3",accent:"#78608e",ink:"#ffffff",line:"#bfafd0"},
  amistad:{recipient:"Para una amistad",badge:"PARA UN AMIGO/A",symbol:"☆",tint:"#e7edf5",accent:"#52769c",ink:"#ffffff",line:"#afc3df"},
  aniversario:{recipient:"Aniversario",badge:"ANIVERSARIO",symbol:"∞",tint:"#f2e4ed",accent:"#8f536c",ink:"#ffffff",line:"#d9aec7"},
  propuesta:{recipient:"Propuesta",badge:"PROPUESTA",symbol:"◇",tint:"#f2e8db",accent:"#927146",ink:"#ffffff",line:"#d9c39e"},
};

function GiftImage({gift,recipient,symbol}:{gift:Experience;recipient:string;symbol:string}){
  // Catalog-only marketing portrait; the original couple demo remains untouched.
  // Free Unsplash photograph: https://unsplash.com/photos/beautiful-couple-pictures (source: photo-1592065148456-98a6d7827bed)
  const coupleCover={
    url:"https://images.unsplash.com/photo-1592065148456-98a6d7827bed?auto=format&fit=crop&fm=jpg&q=82&w=1100",
    position:"center" as const,
  };
  const photo=gift.slug==="pareja"?coupleCover:gift.demo.photos?.[0];
  return <div className="thi-simple-image" style={photo?{
    "--simple-image":`url("${photo.url}")`,
    "--simple-position":photo.position||"center",
  } as CSSProperties:undefined}>
    <span className="thi-simple-image-number" aria-hidden="true">TH / {String(ORDER.indexOf(gift.slug as typeof ORDER[number])+1).padStart(2,"0")}</span>
    <span className="thi-simple-category-badge">
      <span className="thi-simple-category-symbol" aria-hidden="true">{symbol}</span>
      <span>{recipient}</span>
    </span>
  </div>;
}

export default function GiftPicker({onSelect}:{onSelect:(slug:string)=>void}){
  const all=[...experiences].sort((a,b)=>ORDER.indexOf(a.slug as typeof ORDER[number])-ORDER.indexOf(b.slug as typeof ORDER[number]));
  return <div className="thi-simple-picker thi-simple-picker-premium">
    <header className="thi-simple-intro">
      <div>
        <span className="thi-buy-eyebrow">01 · ELEGÍ TU REGALO</span>
        <h1>¿A quién querés <em>sorprender?</em></h1>
        <p>Elegí la experiencia que más te guste. La personalizás después de pagar.</p>
      </div>
      <div className="thi-simple-price" aria-label={`Cada experiencia cuesta ${formatTeHiceEstoPrice()} en un único pago`}>
        <span className="thi-simple-price-gift" aria-hidden="true">♡</span>
        <div className="thi-simple-price-main">
          <small>PRECIO POR EXPERIENCIA</small>
          <strong>{formatTeHiceEstoPrice()}</strong>
        </div>
        <div className="thi-simple-price-assurance">
          <span className="thi-simple-price-check" aria-hidden="true">✓</span>
          <small>Pago único</small>
        </div>
      </div>
    </header>

    <div className="thi-simple-catalog" aria-label="Experiencias disponibles">
      {all.map(gift=>{
        const design=GIFT_STYLE[gift.slug]||GIFT_STYLE.pareja;
        return <article key={gift.slug}
          className={`thi-simple-card thi-simple-card-${gift.slug}`}
          style={{
            "--gift-accent":design.accent,
            "--gift-tint":design.tint,
            "--gift-line":design.line,
            "--gift-ink":design.ink,
          } as CSSProperties}>
          <Link className="thi-simple-photo-link"
            href={`/tehiceesto/experiencias/${gift.slug}`}
            target="_blank" rel="noopener noreferrer"
            aria-label={`Ver muestra de ${gift.title} para ${design.recipient.toLowerCase()}`}>
            <GiftImage gift={gift} recipient={design.badge} symbol={design.symbol}/>
          </Link>
          <div className="thi-simple-card-content">
            <span className="thi-simple-card-label">{design.recipient}</span>
            <h2>{gift.title}</h2>
            <p>{gift.short}</p>
            <div className="thi-simple-actions">
              <button type="button" className="thi-simple-choose" onClick={()=>onSelect(gift.slug)}>
                Elegir y continuar <span aria-hidden="true">→</span>
              </button>
              <Link href={`/tehiceesto/experiencias/${gift.slug}`}
                target="_blank" rel="noopener noreferrer"
                className="thi-simple-preview">
                <span aria-hidden="true" className="thi-simple-preview-icon">◉</span> Ver muestra <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </article>;
      })}
    </div>
    <p className="thi-simple-footer-note">♡ Cada regalo conserva sus efectos y su recorrido original. Personalizás fotos, audios y palabras después de pagar.</p>
  </div>;
}
