import styles from "./Artefact.module.css";

type Kind = "portrait" | "clock" | "lock" | "letter" | "music" | "doll" | "circuit" | "door" | "signal";
const TICKS = Array.from({ length: 12 }, (_, index) => index);

export default function Artefact({kind,mark}:{kind:Kind;mark?:string}) {
  return <div className={styles.stage+" "+styles[kind]} aria-hidden="true">
    <div className={styles.lighting}/>
    {kind==="portrait"&&<div className={styles.portraitFrame}>
      <div className={styles.plate}>
        <div className={styles.figure}><div className={styles.hair}/><div className={styles.face}><i/><i/></div><div className={styles.torso}/></div>
        <span className={styles.scratch}/>
      </div>
      <div className={styles.namePlate}>{mark||"1891"}</div>
    </div>}
    {kind==="clock"&&<div className={styles.clockCase}>
      <div className={styles.clockDial}>
        {TICKS.map(n=><i key={n} className={styles.clockTick} style={{transform:"translate(-50%,-50%) rotate("+(n*30)+"deg) translateY(-45px)"}}/>)}
        <b className={styles.clockHandH}/><b className={styles.clockHandM}/><span className={styles.pin}/>
      </div>
      <div className={styles.pendulum}><span/></div>
    </div>}
    {kind==="lock"&&<div className={styles.lockBody}>
      <div className={styles.lockShackle}/>
      <div className={styles.lockFace}><span>IV</span><div className={styles.dials}><i>◆</i><i>◆</i><i>◆</i></div><b className={styles.lockKey}>⌑</b></div>
    </div>}
    {kind==="letter"&&<div className={styles.letterPaper}>
      <div className={styles.letterFold}/>
      <div className={styles.handwriting}><i/><i/><i/><i/><i/><i/></div>
      <div className={styles.wax}><span>✢</span></div>
    </div>}
    {kind==="music"&&<div className={styles.musicBox}>
      <div className={styles.musicLid}><div className={styles.moonMark}>♫</div></div>
      <div className={styles.musicMechanism}>
        <div className={styles.musicRoller}/><div className={styles.musicPins}>{TICKS.slice(0,8).map(n=><i key={n}/>)}</div>
      </div>
      <div className={styles.musicBase}><i/><i/></div>
    </div>}
    {kind==="doll"&&<div className={styles.dollFigure}>
      <div className={styles.dollHair}/><div className={styles.dollHead}><i/><i/></div>
      <div className={styles.dollDress}><span>♡</span></div>
    </div>}
    {kind==="circuit"&&<div className={styles.circuitBoard}>
      <div className={styles.circuitWires}/>
      {[2,3,4,5].map(n=><div key={n} className={styles.fuseSlot}><span>{n}</span><i/></div>)}
      <span className={styles.circuitWarning}>ALIMENTACIÓN · 07</span>
    </div>}
    {kind==="door"&&<div className={styles.doorFrame}><div className={styles.doorInterior}/><div className={styles.doorWood}><span>13</span><i/></div></div>}
    {kind==="signal"&&<div className={styles.signalCompass}><div className={styles.signalRune}>✧</div><div className={styles.signalOrbit}/><span>UNA PISTA. UN CAMINO.</span></div>}
    <div className={styles.propDust}/>
  </div>;
}
