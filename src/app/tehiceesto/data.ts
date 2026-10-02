export type SceneType =
  | "intro" | "door" | "memories" | "stars" | "scratch" | "letter"
  | "finale" | "candles" | "balloons" | "timeline" | "voices" | "quiz"
  | "vault" | "capsule" | "proposal" | "video";

export type Experience = {
  slug: string;
  eyebrow: string;
  title: string;
  short: string;
  icon: string;
  accent: string;
  demoRecipient: string;
  demoGiver: string;
  opening: string;
  closing: string;
  tags: string[];
  recipe: SceneType[];
};

export const experiences: Experience[] = [
  { slug:"pareja", eyebrow:"Para tu persona", title:"Nuestra historia", short:"Un recorrido por lo que fueron, lo que son y todo lo que todavía falta vivir.", icon:"♥", accent:"#ff7a9b", demoRecipient:"Emma", demoGiver:"Julián", opening:"Hay miles de lugares en Internet. Este existe solamente para vos.", closing:"Y si pudiera elegir de nuevo, volvería a encontrarte.", tags:["Pareja","Amor","Sorpresa"], recipe:["intro","door","memories","stars","scratch","letter","finale"] },
  { slug:"cumpleanos", eyebrow:"Un año merece más", title:"Tu día, convertido en experiencia", short:"Velas, recuerdos, mensajes y sorpresas que se van desbloqueando.", icon:"✦", accent:"#ffb35c", demoRecipient:"Sofi", demoGiver:"Tus personas favoritas", opening:"Hoy no queríamos mandarte solamente un mensaje. Queríamos hacerte un lugar.", closing:"Que este año te encuentre rodeada de todo lo que te hace bien.", tags:["Cumpleaños","Amigos","Familia"], recipe:["intro","candles","balloons","memories","voices","letter","finale"] },
  { slug:"hijos", eyebrow:"Para guardar una vida", title:"Desde que llegaste", short:"Una cápsula emocional de mamá, papá o familia para un hijo.", icon:"☼", accent:"#8fd9cb", demoRecipient:"Lola", demoGiver:"Mamá y Papá", opening:"Antes de que puedas recordar todo esto, nosotros ya lo estábamos guardando para vos.", closing:"Crezcas cuanto crezcas, siempre vas a tener un lugar al que volver.", tags:["Hijos","Familia","Cápsula"], recipe:["intro","timeline","memories","stars","capsule","letter","finale"] },
  { slug:"abuelos", eyebrow:"Una vida que merece quedar", title:"El museo de tu historia", short:"Décadas de recuerdos convertidas en un recorrido familiar inolvidable.", icon:"⌛", accent:"#d8b987", demoRecipient:"Abuela Elena", demoGiver:"Toda tu familia", opening:"Hay historias que no deberían quedar guardadas en una caja de fotos.", closing:"Tu historia también es la nuestra. Gracias por haberla empezado.", tags:["Abuelos","Legado","Familia"], recipe:["intro","timeline","memories","voices","stars","letter","finale"] },
  { slug:"aniversario", eyebrow:"Otro capítulo juntos", title:"Todo lo que construimos", short:"Una experiencia íntima para volver a recorrer la relación desde el comienzo.", icon:"∞", accent:"#d197ff", demoRecipient:"Martina", demoGiver:"Nico", opening:"Pasó otro año. Pero algunas cosas todavía me siguen pasando como el primer día.", closing:"Feliz nosotros.", tags:["Aniversario","Pareja","Recuerdos"], recipe:["intro","timeline","memories","quiz","scratch","letter","finale"] },
  { slug:"propuesta", eyebrow:"La pregunta más importante", title:"Antes de preguntarte algo…", short:"La historia de ustedes conduce a una última puerta y una sola pregunta.", icon:"◇", accent:"#f6d58f", demoRecipient:"Clara", demoGiver:"Tomás", opening:"Para llegar hasta esta pregunta primero tenemos que volver a pasar por algunas cosas.", closing:"¿Querés casarte conmigo?", tags:["Propuesta","Casamiento","Pareja"], recipe:["intro","door","memories","stars","vault","letter","proposal"] },
  { slug:"mama-papa", eyebrow:"Para quienes estuvieron primero", title:"Todo lo que quizá nunca te dije", short:"Un recorrido de gratitud hecho con recuerdos familiares y palabras que importan.", icon:"❋", accent:"#ff9a7a", demoRecipient:"Mamá", demoGiver:"Tus hijos", opening:"Hay cosas que uno siente toda la vida y tarda demasiado en decir.", closing:"Gracias por ser casa incluso cuando estamos lejos.", tags:["Mamá","Papá","Gratitud"], recipe:["intro","memories","voices","stars","letter","scratch","finale"] },
  { slug:"amistad", eyebrow:"Para tu persona elegida", title:"El archivo secreto de nuestra amistad", short:"Anécdotas, papelones, fotos y mensajes que sólo ustedes entienden.", icon:"✹", accent:"#79b7ff", demoRecipient:"Vale", demoGiver:"Cami", opening:"Advertencia: este archivo contiene pruebas de demasiadas malas decisiones juntas.", closing:"Gracias por estar en todas. Incluso en las que era mejor no estar.", tags:["Amistad","Humor","Recuerdos"], recipe:["intro","quiz","memories","balloons","scratch","letter","finale"] },
];

export function getExperience(slug:string){ return experiences.find(x=>x.slug===slug); }
