import styles from "./Artefact.module.css";

type Kind = "portrait" | "clock" | "lock" | "letter" | "music" | "doll" | "circuit" | "door" | "signal";

const DETAILS:Record<Kind,{number:string;label:string}> = {
  portrait:{number:"01",label:"ARCHIVO FAMILIAR"},
  clock:{number:"02",label:"MECANISMO DETENIDO"},
  lock:{number:"03",label:"CERRADURA / PROPIEDAD 013"},
  letter:{number:"04",label:"CORRESPONDENCIA RECUPERADA"},
  music:{number:"05",label:"MELODÍA DE EVA"},
  doll:{number:"06",label:"PERTENENCIA DE EVA"},
  circuit:{number:"07",label:"CONTROL ELÉCTRICO"},
  door:{number:"08",label:"ÚLTIMO UMBRAL"},
  signal:{number:"09",label:"MENSAJE SIN REMITENTE"}
};

/** A physically photographed evidence close-up, rather than a UI icon. */
export default function Artefact({kind,mark,speaking=false}:{kind:Kind;mark?:string;speaking?:boolean}) {
  const info=DETAILS[kind];
  return (
    <div className={styles.stage+" "+styles[kind]+" "+(speaking?styles.speaking:"")} aria-hidden="true">
      <div className={styles.photograph} style={{backgroundImage:`url("/escape/images/objects/${kind}.webp")`}}/>
      <div className={styles.lens}/>
      <div className={styles.vhsGrain}/>
      <div className={styles.filmEdge}/>
      {kind==="portrait"&&<div className={styles.brassPlate}>{mark||"1891"}</div>}
      {kind==="doll"&&<div className={styles.heartbeat}><span/><span/><span/><span/><span/><span/><span/></div>}
      <div className={styles.evidenceTag}><span>UMB / {info.number}</span><span>{info.label}</span></div>
    </div>
  );
}
