"use client";

import { useState } from "react";
import styles from "./PhysicalLetter.module.css";

type LetterKind="study"|"eva";
const TEXT={
  study:{
    sender:"CORRESPONDENCIA DE EVA · 02:17",
    addressee:"Para quien vuelva a la casa",
    lines:["Primero mirá el cielo.","Después buscá el camino.","Al final, recordá lo que florece.","Solo entonces se apartarán los libros."],
    back:"En el borde del papel hay tres pequeños dibujos: una luna, una llave y una rosa. El pasadizo no se abre con fuerza. Se abre con memoria.",
    seal:"E"
  },
  eva:{
    sender:"ÚLTIMA CARTA DE EVA · 13 OCT",
    addressee:"Para quien todavía escucha",
    lines:["Cuando la música calle, buscame.","Siempre empezaba con SOL.","Seguía con MI, con LA,","y volvía a SOL."],
    back:"No rompas la caja. Tocala. Cuando termine la canción, vas a encontrar algo que escondí antes de que las luces se apagaran.",
    seal:"E"
  }
} as const;

/** A tactile double-sided clue, readable by keyboard and screen readers. */
export default function PhysicalLetter({kind}: {kind:LetterKind}){
  const [flipped,setFlipped]=useState(false);
  const t=TEXT[kind];
  return <div className={styles.wrapper} data-letter-owner={kind}>
    <div className={styles.caption}><span>◈ PAPEL ENVEJECIDO · ORIGINAL RECUPERADO</span><span>UMB/013</span></div>
    <button type="button" className={styles.folio} aria-label={flipped?"Volver al frente de la carta":"Dar vuelta la carta"} aria-pressed={flipped} onClick={()=>setFlipped(v=>!v)} data-side={flipped?"reverse":"front"}>
      <span className={styles.front}>
        <span className={styles.top}>{t.sender}</span>
        <span className={styles.salutation}>{t.addressee},</span>
        <span className={styles.letterText}>{t.lines.map((line,i)=><span key={line} className={i===3?styles.emphasized:""}>{line}</span>)}</span>
        <span className={styles.signature}>— Eva</span>
        <span className={styles.wax} aria-hidden="true">{t.seal}</span>
        <span className={styles.pageNumber}>PÁGINA 01 / 02</span>
      </span>
      <span className={styles.back}>
        <span className={styles.top}>AL DORSO, ESCRITO A LÁPIZ</span>
        <span className={styles.watermark}>013</span>
        <span className={styles.backNote}>{t.back}</span>
        <span className={styles.stamp}>LA CASA RECUERDA</span>
        <span className={styles.pageNumber}>PÁGINA 02 / 02</span>
      </span>
    </button>
    <p className={styles.prompt}>{flipped?"↶ TOCÁ PARA VOLVER AL FRENTE":"↷ TOCÁ PARA DAR VUELTA LA CARTA"} · PISTA EN AMBAS CARAS</p>
  </div>;
}
