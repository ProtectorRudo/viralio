"use client";
import {useEffect,useRef,useState,type PointerEvent} from "react";
import "./FriendshipPhotoPuzzle.css";
type Props={photo?:string;position?:string;caption?:string;onSolved:()=>void;onContinue:()=>void};
const INITIAL=[4,6,0,8,1,5,2,7,3];
export default function FriendshipPhotoPuzzle({photo,caption,onSolved,onContinue}:Props){
  const [tiles,setTiles]=useState<number[]>(()=>[...INITIAL]);
  const [chosen,setChosen]=useState<number|null>(null);
  const [moves,setMoves]=useState(0);
  const [done,setDone]=useState(false);
  const notified=useRef(false);
  const pointer=useRef<{slot:number;x:number;y:number}|null>(null);
  useEffect(()=>{if(!done||notified.current)return;notified.current=true;onSolved()},[done,onSolved]);
  const swap=(a:number,b:number)=>{
    if(done||a===b)return;
    const updated=[...tiles];[updated[a],updated[b]]=[updated[b],updated[a]];
    setTiles(updated);setMoves(n=>n+1);setChosen(null);
    if(updated.every((v,i)=>v===i)){setDone(true);navigator.vibrate?.([12,30,12])}
  };
  const choose=(slot:number)=>{if(done)return;if(chosen===null){setChosen(slot);return}if(chosen===slot){setChosen(null);return}swap(chosen,slot)};
  const pointerDown=(event:PointerEvent<HTMLButtonElement>,slot:number)=>{pointer.current={slot,x:event.clientX,y:event.clientY}};
  const pointerUp=(event:PointerEvent<HTMLButtonElement>,slot:number)=>{
    const start=pointer.current;pointer.current=null;
    if(!start||start.slot!==slot||Math.hypot(event.clientX-start.x,event.clientY-start.y)<20)return;
    const buttons=[...event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>("button[data-tile-slot]")];
    const target=buttons.find(button=>{const r=button.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom});
    if(target){const other=Number(target.dataset.tileSlot);if(other!==slot)swap(slot,other)}
  };
  return <section className={"thi-scene friendship-scene friend-puzzle-scene"+(done?" friend-puzzle-complete":"")} data-friend-puzzle>
    <div className="friend-puzzle-aura" aria-hidden="true"/>
    <p className="friend-overline">OTRA PRUEBA DE QUE LO NUESTRO VALE ORO</p>
    <h2>Las mejores amistades se arman <em>pieza por pieza.</em></h2>
    <p className="friend-puzzle-intro">Un día fue una charla. Después, una risa. Y sin darnos cuenta, entre mil momentos, armamos algo que vale oro. Esta foto tiene nueve piezas. Nuestra amistad, muchísimas más.</p>
    <div className="friend-puzzle-frame">
      <div className="friend-puzzle-frame-top"><span>ARCHIVO DE RECUERDOS · 021</span><b>{done?"✦ COMPLETO":moves+" MOVIMIENTOS"}</b></div>
      <div className="friend-puzzle-grid" role="group" aria-label="Rompecabezas de nueve piezas; elegí dos para intercambiarlas">
        {tiles.map((piece,slot)=><button key={slot} type="button" data-tile-slot={slot}
          className={"friend-puzzle-tile"+(chosen===slot?" selected":"")+(done?" solved":"")}
          aria-label={"Posición "+(slot+1)+", pieza "+(piece+1)+(chosen===slot?", seleccionada":"")}
          aria-pressed={chosen===slot} onClick={()=>choose(slot)}
          onPointerDown={event=>pointerDown(event,slot)} onPointerUp={event=>pointerUp(event,slot)}
          onPointerCancel={()=>{pointer.current=null}}
          style={{backgroundImage:photo?'url("'+photo.replace(/"/g,"%22")+'")':undefined,backgroundSize:"300% 300%",backgroundPosition:(piece%3)*50+"% "+Math.floor(piece/3)*50+"%"}}
        >{!photo&&<span>✦</span>}<span className="friend-puzzle-tile-number">{String(piece+1).padStart(2,"0")}</span></button>)}
      </div>
      <div className="friend-puzzle-frame-footer">{done?"Así se ve cuando todo encaja. Y qué suerte haber coincidido.":"Tocá dos piezas para intercambiarlas. También podés arrastrar con el dedo."}</div>
    </div>
    <div className="friend-puzzle-progress" aria-label={tiles.filter((n,i)=>n===i).length+" de 9 piezas en su lugar"}>
      {Array.from({length:9},(_,i)=><i key={i} className={tiles[i]===i?"correct":""}/>)}
    </div>
    {done&&<div className="friend-puzzle-completion" role="status">
      <div className="friend-puzzle-gold-dust" aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{"--i":i} as React.CSSProperties}>✦</i>)}</div>
      <p>Al final, cada pedacito cuenta.</p>
      <strong>Y nuestra amistad es mi parte favorita de la historia.</strong>
      {caption&&<small>{caption}</small>}
      <button type="button" data-action="advance" onClick={onContinue}>Hay algo que quiero decirte <span>→</span></button>
    </div>}
    {!done&&<p className="friend-puzzle-hint">Cuando la foto esté completa, vas a descubrir lo que sigue.</p>}
  </section>;
}
