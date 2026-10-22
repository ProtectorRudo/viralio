import {describe,it,expect} from "vitest";
import {assessTimeline, type TimelineEvent} from "../src/lib/cierre/timeline";
const q=1000;
const e=(id:string,atMs:number,signal:string,direction:"in"|"out"="in",aiSignal?:string):TimelineEvent=>
  ({eventId:id,atMs,signal,direction,aiSignal});
describe("CIERRE — reducer de mensajes recibidos",()=>{
 it("un simple gracias puede seguir siendo candidato en modo sombra",()=>
   expect(assessTimeline(q,[e("1",1100,"ack")]).status).toBe("candidate"));
 it("un pago posterior bloquea",()=>
   expect(assessTimeline(q,[e("1",1100,"ack"),e("2",1200,"purchase")]).status).toBe("blocked"));
 it("un pago atrasado igualmente bloquea",()=>
   expect(assessTimeline(q,[e("2",1200,"ack"),e("1",1100,"purchase")]).status).toBe("blocked"));
 it("un rechazo bloquea incluso seguido de gracias",()=>
   expect(assessTimeline(q,[e("1",1100,"rejected"),e("2",1200,"ack")]).status).toBe("blocked"));
 it("la baja bloquea futuras sugerencias",()=>
   expect(assessTimeline(q,[e("1",1100,"optout")]).status).toBe("blocked"));
 it("pregunta sin respuesta queda esperando",()=>
   expect(assessTimeline(q,[e("1",1100,"question"),e("2",1200,"ack")]).status).toBe("waiting"));
 it("pregunta respondida por vendedor no se vuelve automáticamente candidata",()=>
   expect(assessTimeline(q,[e("1",1100,"question"),e("2",1200,"seller_activity","out"),e("3",1300,"ack")]).status).toBe("review"));
 it("mensaje manual del vendedor deja en revisión",()=>
   expect(assessTimeline(q,[e("1",1200,"seller_activity","out")]).status).toBe("review"));
 it("seguimiento humano bloquea",()=>
   expect(assessTimeline(q,[e("1",1200,"human_followup","out")]).status).toBe("blocked"));
 it("audio del cliente exige revisión",()=>
   expect(assessTimeline(q,[e("1",1200,"unverified")]).status).toBe("review"));
 it("mensaje ambiguo no habilita envíos",()=>
   expect(assessTimeline(q,[e("1",1200,"ambiguous")]).status).toBe("review"));
 it("una decisión de IA detectando compra bloquea",()=>
   expect(assessTimeline(q,[e("1",1200,"unknown","in","purchase")]).status).toBe("blocked"));
 it("eventos anteriores al PDF no afectan ese presupuesto",()=>
   expect(assessTimeline(q,[e("1",900,"purchase"),e("2",1200,"ack")]).status).toBe("candidate"));
 it("demasiada actividad se deriva a revisión",()=>
   expect(assessTimeline(q,Array.from({length:501},(_,i)=>e(String(i),1200+i,"ack"))).status).toBe("review"));
 it("no hay recomendaciones sin cronología válida",()=>
   expect(assessTimeline(-1,[e("1",1200,"ack")]).status).toBe("review"));
});
