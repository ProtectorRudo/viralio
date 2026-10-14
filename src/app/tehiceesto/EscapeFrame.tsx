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
   <Link className={styles.order} href={"/escapes/"+room.slug+"/comprar"}>QUIERO REGALAR ESTA SALA ↗</Link>
  </div>}
  <div className={styles.frameWrap}>
   <div className={`${styles.launchRoom} ${styles["launch"+room.slug.replace(/(^|-)([a-z])/g,(_,a,b)=>b.toUpperCase())]||""}`}>
      <span className={styles.launchEyebrow}>{customer?"UNA EXPERIENCIA PREPARADA PARA VOS":"DEMO GRATUITA · ESCAPE ROOM INTERACTIVO"}</span>
      <h1>{room.slug==="caso-m"?"Tres minutos. Un secreto.":room.slug==="ultima-funcion"?"El cine cerró. La historia no.":"El tiempo corre. La sorpresa espera."}</h1>
      <p>{room.slug==="caso-m"
        ?"Encontrá las evidencias, descifrá seis cifras y rescatá el sobre antes de que se agote el tiempo."
        :room.slug==="ultima-funcion"
          ?"Entrá al cine abandonado, descubrí qué pasó en la última función y resolvé el misterio."
          :"Explorá un jardín que se apaga, resolvé sus mecanismos y encontrá la carta oculta."}</p>
      <a href={src} className={styles.launchButton} aria-label={"Iniciar partida de "+room.title}>
        <span aria-hidden="true">▶</span> {customer?"ABRIR MI EXPERIENCIA":"INICIAR DEMO Y JUGAR"} <b aria-hidden="true">↗</b>
      </a>
      <small>El juego se abre a pantalla completa para que los movimientos, el sonido y el táctil funcionen correctamente.</small>
      {room.slug!=="caso-m"&&<small>Volvé con el botón Atrás de tu navegador cuando quieras conocer otra experiencia.</small>}
   </div>
  </div>
  {!customer&&<div className={styles.playerFooter}>
    <p>El juego empieza en la pantalla. La sorpresa aparece cuando logran escapar.</p>
    <Link href={"/escapes/"+room.slug+"/comprar"}>Personalizar y regalar esta experiencia ↗</Link>
  </div>}
 </main>;
}
