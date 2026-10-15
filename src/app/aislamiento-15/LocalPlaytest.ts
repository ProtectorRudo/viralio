/**
 * AISLAMIENTO 15 — anonymous, entirely local playtest measurements.
 * No analytics SDK, network traffic, account IDs or fingerprinting.
 * Reports are generated only when a player chooses to copy them.
 */
export type QualityRoom=0|1|2;
export type QualityOutcome="evacuacion"|"sellado";
const rooms=["Urgencias","Aislamiento","Contencion"] as const;
export class LocalPlaytest {
  private marks: Array<number|null>=[0,null,null];
  private samples:number[]=[];
  private catches=0;
  private penalties=0;
  private graceSeconds=0;
  reset(){this.marks=[0,null,null];this.samples=[];this.catches=0;this.penalties=0;this.graceSeconds=0;}
  enter(room:QualityRoom,elapsed:number){
    if(this.marks[room]===null)this.marks[room]=Math.max(0,elapsed);
  }
  fps(sample:number){
    if(Number.isFinite(sample)&&sample>0&&sample<=240&&this.samples.length<1200)
      this.samples.push(sample);
  }
  caught(){this.catches++;this.penalties+=16;}
  penalize(seconds:number){this.penalties+=Math.max(0,seconds);}
  courtesy(milliseconds:number){this.graceSeconds+=Math.max(0,milliseconds)/1000;}
  report(input:{
    outcome:QualityOutcome;
    elapsed:number;
    hints:number;
    render:{dpr:number;drawCalls:number;triangles:number;webgl2:boolean;software:boolean};
    viewport:{width:number;height:number};
  }):string{
    const {outcome,elapsed,hints,render,viewport}=input;
    const sorted=this.samples.slice().sort((a,b)=>a-b);
    const average=sorted.length?Math.round(sorted.reduce((a,b)=>a+b,0)/sorted.length):null;
    const low=sorted.length?Math.round(sorted[Math.floor((sorted.length-1)*.1)]):null;
    const below30=sorted.length?Math.round(this.samples.filter(v=>v<30).length*100/sorted.length):null;
    const fmt=(value:number)=>Math.floor(value/60)+"m "+Math.round(value%60)+"s";
    const roomLines=rooms.map((name,index)=>{
      const start=this.marks[index];
      if(start===null)return "- "+name+": no alcanzada";
      const end=(index<2?this.marks[index+1]:null)??Math.max(0,elapsed);
      return "- "+name+": "+fmt(Math.max(0,end-start));
    });
    return [
      "AISLAMIENTO 15 / INFORME LOCAL DE PRUEBA",
      "Resultado: "+(outcome==="evacuacion"?"evacuacion":"sellado"),
      "Tiempo consumido: "+fmt(Math.max(0,elapsed))+" / 15m",
      "Pistas consultadas: "+hints,
      "Encuentros con El Celador: "+this.catches,
      "Penalizaciones: "+fmt(this.penalties),
      "Cortesia por interrupciones: "+this.graceSeconds.toFixed(1)+"s / 45s",
      "Duracion por sector (incluye penalizaciones):",
      ...roomLines,
      "Pantalla: "+viewport.width+"x"+viewport.height,
      "WebGL: "+(render.webgl2?"2":"compatibilidad")+" / "+(render.software?"software":"hardware")+
        " / escala "+render.dpr.toFixed(2)+"x",
      "FPS medio (muestras cada ~1,3s): "+(average??"sin datos"),
      "FPS percentil 10: "+(low??"sin datos"),
      "Muestras por debajo de 30 FPS: "+(below30===null?"sin datos":below30+"%"),
      "Llamadas de dibujo finales: "+render.drawCalls,
      "Triangulos finales: "+render.triangles,
      "Cifras del navegador: no sustituyen un benchmark certificado.",
      "Datos locales. Solo se comparten si copias este informe."
    ].join("\n");
  }
}
