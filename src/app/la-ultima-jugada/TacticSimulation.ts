/**
 * Original, deterministic tactical footage for La Última Jugada.
 * No video rights or external match footage. The three camera feeds share
 * the same play; two contain a continuity defect that the player can spot.
 */
export type ReplayCamera = "C1" | "C2" | "C3";
export type TacticFrame = {
  ball: {x:number;y:number};
  duplicate?: {x:number;y:number};
  argentina: ReadonlyArray<{n:number;x:number;y:number}>;
  england: ReadonlyArray<{n:number;x:number;y:number}>;
  timecode: string;
};

export function tacticsFrame(camera:ReplayCamera, progress:number):TacticFrame {
 const p=((progress%1)+1)%1;
 const movement=(a:number,b:number)=>a+(b-a)*p;
 const ball={x:movement(25,79),y:65-25*Math.sin(Math.PI*p)-9*p};
 if(camera==="C1" && p>=.43 && p<=.69) {
   ball.x+=20;ball.y-=13; // Impossible discontinuity in ball trajectory.
 }
 const duplicate=camera==="C3"&&p>=.43&&p<=.69?{x:ball.x-24,y:ball.y+12}:undefined;
 return {
  ball,duplicate,
  argentina:[
   {n:7,x:movement(41,81),y:movement(23,22)},
   {n:10,x:movement(41,63),y:movement(59,49)},
   {n:9,x:movement(66,89),y:movement(53,45)},
   {n:8,x:movement(25,43),y:movement(77,68)}
  ],
  england:[
   {n:4,x:movement(66,70),y:movement(46,49)},
   {n:5,x:movement(76,66),y:movement(54,51)},
   {n:6,x:movement(72,73),y:movement(29,44)},
   {n:3,x:movement(88,90),y:movement(61,60)}
  ],
  timecode:"89:"+String(Math.floor(p*60)).padStart(2,"0")+"."+String(Math.floor((p*60%1)*10))
 };
}

export function paintTacticalFeed(
 ctx:CanvasRenderingContext2D,
 camera:ReplayCamera,
 progress:number,
 width:number,
 height:number
){
 const state=tacticsFrame(camera,progress), w=width,h=height;
 ctx.clearRect(0,0,w,h);
 ctx.fillStyle="#07151d";ctx.fillRect(0,0,w,h);
 const insetX=w*.06,insetY=h*.14,fieldW=w*.88,fieldH=h*.74;
 const sx=(x:number)=>insetX+fieldW*x/100,sy=(y:number)=>insetY+fieldH*y/100;
 ctx.save();ctx.beginPath();ctx.rect(insetX,insetY,fieldW,fieldH);ctx.clip();
 for(let i=0;i<10;i++){
  ctx.fillStyle=i%2===0?"#174c41":"#215847";
  ctx.fillRect(insetX+i*fieldW/10,insetY,fieldW/10+1,fieldH);
 }
 ctx.strokeStyle="#b4dacbaa";ctx.lineWidth=Math.max(1,w*.003);ctx.strokeRect(insetX+1,insetY+1,fieldW-2,fieldH-2);
 ctx.beginPath();ctx.moveTo(sx(50),sy(0));ctx.lineTo(sx(50),sy(100));ctx.stroke();
 ctx.beginPath();ctx.ellipse(sx(50),sy(50),fieldW*.09,fieldH*.18,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeRect(sx(0),sy(25),fieldW*.16,fieldH*.50);
 ctx.strokeRect(sx(84),sy(25),fieldW*.16,fieldH*.50);
 ctx.fillStyle="#94d9ff";
 for(const p of state.argentina){
  ctx.beginPath();ctx.arc(sx(p.x),sy(p.y),Math.max(6,w*.023),0,Math.PI*2);ctx.fill();
  ctx.font="bold "+Math.round(w*.025)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#0e2635";
  ctx.fillText(String(p.n),sx(p.x),sy(p.y)+1);ctx.fillStyle="#94d9ff";
 }
 ctx.fillStyle="#fff0e1";
 for(const p of state.england){
  ctx.beginPath();ctx.arc(sx(p.x),sy(p.y),Math.max(6,w*.022),0,Math.PI*2);ctx.fill();
  ctx.font="bold "+Math.round(w*.025)+"px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#782c2e";
  ctx.fillText(String(p.n),sx(p.x),sy(p.y)+1);ctx.fillStyle="#fff0e1";
 }
 function renderBall(x:number,y:number) {
  ctx.shadowBlur=9;ctx.shadowColor="#fff";ctx.beginPath();
  ctx.arc(sx(x),sy(y),Math.max(4,w*.013),0,Math.PI*2);
  ctx.fillStyle="#ffffff";ctx.fill();ctx.shadowBlur=0;
  ctx.beginPath();ctx.arc(sx(x),sy(y),Math.max(1,w*.004),0,Math.PI*2);
  ctx.fillStyle="#172c33";ctx.fill();
 }
 renderBall(state.ball.x,state.ball.y);
 if(state.duplicate)renderBall(state.duplicate.x,state.duplicate.y);
 ctx.restore();
 ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle="#96dbfc";
 ctx.font="bold "+Math.round(w*.039)+"px monospace";ctx.fillText(camera+"  /  CAM TÁCTICA",w*.06,h*.092);
 ctx.textAlign="right";ctx.fillStyle="#f2cf91";ctx.fillText(state.timecode,w*.93,h*.092);
 ctx.textAlign="left";ctx.font=Math.round(w*.023)+"px monospace";ctx.fillStyle="#aecad4";
 ctx.fillText("ARG 1 - 1 ENG    ● REC",w*.06,h*.95);
 // Pseudo-analogue scan lines, deliberately not obscuring clue visibility.
 ctx.fillStyle="#07131a18";for(let y=3;y<h;y+=6)ctx.fillRect(0,y,w,1);
}
