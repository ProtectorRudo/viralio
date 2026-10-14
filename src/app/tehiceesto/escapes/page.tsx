import type {Metadata} from "next";
import Link from "next/link";
import {escapeRooms} from "../escape-rooms";
import styles from "./escape.module.css";
export const metadata:Metadata={title:"Escape rooms para regalar · Te Hice Esto",description:"Tres salas de escape premium que terminan con una invitación o una carta personal."};
export default function EscapeCatalog(){
 return <main className={styles.section}>
  <header className={styles.heading}>
    <span className={styles.eyebrow}>TE HICE ESTO · COLECCIÓN INTERACTIVA</span>
    <h1>Un misterio que termina en <em>algo inolvidable.</em></h1>
    <p className={styles.lead}>El regalo no aparece hasta que la otra persona lo descubre. Tres mundos tridimensionales, tres formas de sorprender y un final hecho exclusivamente para alguien especial.</p>
  </header>
  <div className={styles.cards}>{escapeRooms.map((room,i)=><Link key={room.slug} href={"/escapes/"+room.slug} className={styles.card} style={{"--accent":room.accent} as React.CSSProperties}>
   <span className={styles.number}>ARCHIVO {String(i+1).padStart(2,"0")} / 03 · {room.eyebrow}</span>
   <h2>{room.title}</h2><p>{room.description}</p>
   <span className={styles.meta}>{room.duration}</span>
   <div className={styles.action}><span>ENTRAR A LA DEMO</span><strong>↗</strong></div>
  </Link>)}</div>
  <p className={styles.note}>Cada sala conserva exactamente sus mecanismos y recorrido. Personalizamos únicamente la invitación final y los contenidos previstos. En CASO M, también el código de seis cifras y sus indicios.</p>
 </main>;
}