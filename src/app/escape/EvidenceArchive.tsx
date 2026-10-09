import styles from "./EvidenceArchive.module.css";

type Evidence = {id:string; title:string;note:string;chapter:string;found:boolean;symbol:string};
type Props = { portraits:number[]; notesRead:boolean; evaRead:boolean; nurseryOpen:boolean; keepsake:boolean; power:boolean };

export default function EvidenceArchive({portraits,notesRead,evaRead,nurseryOpen,keepsake,power}:Props) {
  const records:Evidence[] = [
    {id:"nora",title:"El retrato de Nora",chapter:"VESTÍBULO",note:"1918 · El marco lleva el número 4. Alguien alteró el orden de las fotos.",symbol:"✧",found:portraits.includes(2)},
    {id:"mara",title:"La madre",chapter:"VESTÍBULO",note:"1902 · La cifra 2 aparece bajo un ramo de flores marchitas.",symbol:"◇",found:portraits.includes(1)},
    {id:"elias",title:"El guardián",chapter:"VESTÍBULO",note:"1891 · La cifra 7 está marcada sobre la madera.",symbol:"♜",found:portraits.includes(0)},
    {id:"letter",title:"Nota entre cenizas",chapter:"DESPACHO",note:"«Cielo, camino y lo que florece». Las velas esconden una secuencia.",symbol:"✉",found:notesRead},
    {id:"eva",title:"El cuaderno de Eva",chapter:"HABITACIÓN",note:"Una melodía quedó escrita: SOL · MI · LA · SOL.",symbol:"♫",found:evaRead},
    {id:"song",title:"El secreto de la caja",chapter:"HABITACIÓN",note:"La fotografía de Eva apareció debajo de la música.",symbol:"☽",found:nurseryOpen},
    {id:"medal",title:"Medalla de Eva",chapter:"HABITACIÓN",note:"«Nunca dejes a nadie atrás». Tal vez no sea solo un recuerdo.",symbol:"♥",found:keepsake},
    {id:"power",title:"El corazón de la casa",chapter:"SUBSUELO",note:"Dos fusibles sumaron siete. Una voz llegó desde la pared.",symbol:"⚡",found:power},
  ];
  const found=records.filter(r=>r.found).length;
  return <div className={styles.archive}>
    <header className={styles.header}>
      <div className={styles.stamp}>ARCHIVO<br/>RESTRINGIDO<br/>013</div>
      <div>
        <span className={styles.kicker}>PERTENENCIAS ENCONTRADAS</span>
        <h2>El expediente de Eva</h2>
        <p>Todo deja una huella. Algunas pistas también cambian el final.</p>
      </div>
    </header>
    <div className={styles.progress}><span>PIEZAS RECUPERADAS</span><strong>{found} / {records.length}</strong><div className={styles.track}><div style={{width:(found/records.length*100)+"%"}}/></div></div>
    <div className={styles.pinboard} aria-label="Tablero de pistas">
      {records.map((record,index)=><article key={record.id} className={styles.clipping+" "+(!record.found?styles.hiddenClue:"")} style={{transform:"rotate("+([-2,1,2,-1,2,-2,-1,1][index])+"deg)"}}>
        <div className={styles.tape}/>
        <div className={styles.clippingTop}><span>CAP. {record.chapter}</span><span>{record.found?"CONFIRMADO":"??? / 013"}</span></div>
        <div className={styles.glyph}>{record.found?record.symbol:"?"}</div>
        <h3>{record.found?record.title:"Evidencia sin encontrar"}</h3>
        <p>{record.found?record.note:"Esta pieza todavía espera en algún rincón de la casa."}</p>
        <div className={styles.stampTiny}>{record.found?"RECUPERADO":"SIN CLASIFICAR"}</div>
      </article>)}
    </div>
    <p className={styles.caption}>No necesitás descubrir todo para salir, pero los recuerdos que llevás pueden cambiar el significado de tu escape.</p>
  </div>;
}
