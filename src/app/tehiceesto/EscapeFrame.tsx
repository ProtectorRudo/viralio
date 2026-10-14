import Link from "next/link";
import {getEscapeSource,type EscapeRoom} from "./escape-rooms";
import styles from "./escapes/escape.module.css";
export default function EscapeFrame({room,config={},customer=false}:{
 room:EscapeRoom;config?:Record<string,string>;customer?:boolean;
}){
 const src=getEscapeSource(room,config);
 return <main className={styles.playerPage}>
  {!customer&&<div className={styles.playerHeader}>
   <Link href="/escapes" className={styles.back}>← Volver a las experiencias</Link>
   <span>DEMO INTERACTIVA · TE HICE ESTO</span>
   <a className={styles.order} href={"https://wa.me/5492215653163?text="+encodeURIComponent("Hola! Quiero personalizar "+room.title+" para regalar. ¿Cómo seguimos?")} target="_blank" rel="noopener noreferrer">QUIERO REGALAR ESTA SALA ↗</a>
  </div>}
  <div className={styles.frameWrap}>
   {room.slug==="caso-m"?
    <div className={styles.launchRoom}>
      <span>CASO M · EXPERIENCIA INTERACTIVA 3D</span>
      <h1>Tres minutos.<br/>Un secreto.</h1>
      <p>La misión necesita la pantalla completa para que puedas recorrer la sala, encontrar pruebas y resolver el candado.</p>
      <a href={src} target="_self">INICIAR OPERACIÓN RESCATE ↗</a>
    </div>:
    <iframe src={src} title={room.title} className={styles.frame} allow="autoplay; fullscreen" allowFullScreen loading="eager" referrerPolicy="strict-origin-when-cross-origin"/>}
  </div>
  {!customer&&<div className={styles.playerFooter}>
    <p>El juego empieza en la pantalla. La sorpresa aparece cuando logran escapar.</p>
    <a href={src} target="_blank" rel="noopener noreferrer">Abrir el juego en pantalla completa ↗</a>
  </div>}
 </main>;
}
