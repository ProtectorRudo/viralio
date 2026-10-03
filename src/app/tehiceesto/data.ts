export type SceneType =
  | "intro" | "door" | "memories" | "stars" | "scratch" | "letter"
  | "finale" | "candles" | "balloons" | "timeline" | "voices" | "quiz"
  | "vault" | "capsule" | "proposal" | "video" | "light" | "hold";

export type DemoContent = {
  memories?: string[];
  stars?: string[];
  scratchEyebrow?: string;
  scratchReward?: string;
  scratchNote?: string;
  letter?: string;
  balloons?: string[];
  timeline?: { title: string; body: string }[];
  voices?: { name: string; message: string }[];
  quiz?: {
    question: string;
    answers: string[];
    correctIndex: number;
    after: string;
  };
  capsule?: {
    year: string;
    closed: string;
    open: string;
  };
};

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
  demo: DemoContent;
};

export const experiences: Experience[] = [
  {
    slug:"pareja",
    eyebrow:"Para tu persona",
    title:"Nuestra historia",
    short:"Un recorrido por lo que fueron, lo que son y todo lo que todavía falta vivir.",
    icon:"♥",
    accent:"#ff7a9b",
    demoRecipient:"Emma",
    demoGiver:"Julián",
    opening:"Hay miles de lugares en Internet. Este existe solamente para vos.",
    closing:"Y si pudiera elegir de nuevo, volvería a encontrarte.",
    tags:["Pareja","Amor","Sorpresa"],
    recipe:["intro","door","memories","light","stars","scratch","hold","letter","finale"],
    demo:{
      memories:[
        "El café que iba a durar media hora y terminó ocupando toda la tarde.",
        "La foto que casi no sacamos. Hoy es de mis favoritas.",
        "Ese viaje en el que nos perdimos y, por una vez, estuvo buenísimo.",
      ],
      stars:[
        "Cómo hacés hogar incluso en lugares que no son nuestros.",
        "Tu risa cuando algo te causa gracia de verdad.",
        "Que sabés cuándo necesito hablar y cuándo sólo necesito que estés.",
        "La vida que todavía nos falta inventar.",
        "Que te volvería a elegir, incluso sabiendo todo.",
      ],
      scratchEyebrow:"Vale por",
      scratchReward:"una cita sorpresa sin celulares",
      scratchNote:"fecha a elección · sin vencimiento",
      letter:"No quería hacerte un regalo que pudiera guardarse en un cajón. Quería dejarte un lugar al que puedas volver y recordar cuánto significa para mí compartir la vida con vos.",
    },
  },
  {
    slug:"cumpleanos",
    eyebrow:"Un año merece más",
    title:"Tu día, convertido en experiencia",
    short:"Velas, recuerdos, mensajes y sorpresas que se van desbloqueando.",
    icon:"✦",
    accent:"#ffb35c",
    demoRecipient:"Sofi",
    demoGiver:"Tus personas favoritas",
    opening:"Hoy no queríamos mandarte solamente un mensaje. Queríamos hacerte un lugar.",
    closing:"Que este año te encuentre rodeada de todo lo que te hace bien.",
    tags:["Cumpleaños","Amigos","Familia"],
    recipe:["intro","candles","balloons","memories","light","voices","hold","letter","finale"],
    demo:{
      balloons:["Te queremos","Hoy mandás vos","Una cena pendiente","Un abrazo gigante","Elegís el plan","Otra vuelta al sol"],
      memories:[
        "Ese cumpleaños en el que terminamos bailando en la cocina.",
        "La salida improvisada que terminó siendo el mejor plan.",
        "Una de esas fotos que explica perfectamente por qué te queremos.",
      ],
      voices:[
        {name:"Mamá",message:"Que seas muy feliz, hija. Siempre voy a estar orgullosa de vos."},
        {name:"Nati",message:"Gracias por ser esa amiga que aparece incluso antes de que la llamen."},
        {name:"Fran",message:"Este año se festeja en serio. No aceptamos excusas."},
        {name:"Los del grupo",message:"Te queremos muchísimo. Sí, incluso cuando tardás tres días en responder."},
      ],
      letter:"Cumplir años también es mirar alrededor y descubrir cuánta gente juntaste en el camino. Nosotros tuvimos suerte: en algún momento de ese camino apareciste vos.",
    },
  },
  {
    slug:"hijos",
    eyebrow:"Para guardar una vida",
    title:"Desde que llegaste",
    short:"Una cápsula emocional de mamá, papá o familia para un hijo.",
    icon:"☼",
    accent:"#8fd9cb",
    demoRecipient:"Lola",
    demoGiver:"Mamá y Papá",
    opening:"Antes de que puedas recordar todo esto, nosotros ya lo estábamos guardando para vos.",
    closing:"Crezcas cuanto crezcas, siempre vas a tener un lugar al que volver.",
    tags:["Hijos","Familia","Cápsula"],
    recipe:["intro","timeline","memories","light","stars","capsule","hold","letter","finale"],
    demo:{
      timeline:[
        {title:"El día que llegaste",body:"El mundo siguió igual para todos. Para nosotros cambió entero."},
        {title:"Tu primera carcajada",body:"La escuchamos tantas veces que probablemente vos nunca recuerdes la primera."},
        {title:"Hoy",body:"Seguís creciendo más rápido de lo que nos gustaría admitir."},
      ],
      memories:[
        "Dormirte en brazos y quedarnos quietos para no arruinar el milagro.",
        "La primera vez que dijiste una palabra y nosotros juramos que se entendió perfecto.",
        "Tus pequeñas costumbres, esas que algún día vamos a extrañar sin haberlo sabido.",
      ],
      stars:[
        "Tu curiosidad por absolutamente todo.",
        "La forma en que confiás en nosotros.",
        "Tu risa cuando algo te sorprende.",
        "Que nos enseñaste una versión nueva del amor.",
        "Todo lo que todavía vas a descubrir.",
      ],
      capsule:{
        year:"2036",
        closed:"Hay palabras que pueden esperar a que seas un poco más grande.",
        open:"Si estás leyendo esto diez años después, queremos que sepas que ya estábamos orgullosos de vos mucho antes de conocer en quién te ibas a convertir.",
      },
      letter:"Quizá algún día no recuerdes cómo eran estas noches, estas canciones o estas manos levantándote del piso. Nosotros sí. Y queríamos guardar un pedacito para vos.",
    },
  },
  {
    slug:"abuelos",
    eyebrow:"Una vida que merece quedar",
    title:"El museo de tu historia",
    short:"Décadas de recuerdos convertidas en un recorrido familiar inolvidable.",
    icon:"⌛",
    accent:"#d8b987",
    demoRecipient:"Abuela Elena",
    demoGiver:"Toda tu familia",
    opening:"Hay historias que no deberían quedar guardadas en una caja de fotos.",
    closing:"Tu historia también es la nuestra. Gracias por haberla empezado.",
    tags:["Abuelos","Legado","Familia"],
    recipe:["intro","timeline","memories","light","voices","stars","hold","letter","finale"],
    demo:{
      timeline:[
        {title:"Antes de nosotros",body:"Una vida entera ya estaba pasando antes de que llegáramos a conocerla."},
        {title:"La casa llena",body:"Domingos, sobremesas largas y esa costumbre de que siempre hubiera lugar para uno más."},
        {title:"Lo que quedó",body:"Recetas, frases, gestos y maneras de querer que ahora también son nuestras."},
      ],
      memories:[
        "La mesa larga de los domingos y nadie queriéndose ir primero.",
        "Tu receta escrita a mano, con medidas que sólo vos entendés.",
        "Ese sillón donde escuchamos historias que hoy repetimos nosotros.",
      ],
      voices:[
        {name:"Laura",message:"Mamá, gracias por enseñarnos que cuidar también puede parecerse a cocinar de más."},
        {name:"Martín",message:"Hay un montón de cosas mías que recién de grande entendí que vienen de vos."},
        {name:"Cata",message:"Abu, prometo seguir pidiéndote la misma historia aunque ya me la sepa."},
        {name:"Todos",message:"Gracias por haber sido punto de encuentro durante tantos años."},
      ],
      stars:[
        "Tu paciencia infinita.",
        "La manera de acordarte de lo que a todos se nos olvida.",
        "Tus historias repetidas que igual queremos volver a escuchar.",
        "La casa que siempre tuvo una silla más.",
        "Todo lo que de vos sigue viviendo en nosotros.",
      ],
      letter:"Hay personas que dejan recuerdos. Vos dejaste costumbres, palabras, recetas, formas de mirar el mundo. Esta familia se parece a vos en más lugares de los que podemos contar.",
    },
  },
  {
    slug:"aniversario",
    eyebrow:"Otro capítulo juntos",
    title:"Todo lo que construimos",
    short:"Una experiencia íntima para volver a recorrer la relación desde el comienzo.",
    icon:"∞",
    accent:"#d197ff",
    demoRecipient:"Martina",
    demoGiver:"Nico",
    opening:"Pasó otro año. Pero algunas cosas todavía me siguen pasando como el primer día.",
    closing:"Feliz nosotros.",
    tags:["Aniversario","Pareja","Recuerdos"],
    recipe:["intro","timeline","memories","light","quiz","scratch","hold","letter","finale"],
    demo:{
      timeline:[
        {title:"Nos conocimos",body:"Todavía podíamos hacernos los interesantes porque no sabíamos demasiado del otro."},
        {title:"Nos elegimos",body:"Llegó un momento en el que dejar de vernos ya empezó a sentirse raro."},
        {title:"Nos construimos",body:"No perfecto. No fácil siempre. Pero nuestro."},
      ],
      memories:[
        "Nuestro primer viaje: demasiadas cosas en una valija y cero organización.",
        "La primera casa que empezó a sentirse nuestra.",
        "Una noche absolutamente común que, por alguna razón, todavía recuerdo.",
      ],
      quiz:{
        question:"¿Dónde fue nuestro primer beso?",
        answers:["En la puerta de tu casa","En aquel bar diminuto","Después de caminar tres horas"],
        correctIndex:2,
        after:"Sí. Y todavía me acuerdo de exactamente cómo me miraste antes.",
      },
      scratchEyebrow:"Próximo capítulo",
      scratchReward:"una escapada de dos días juntos",
      scratchNote:"destino todavía secreto",
      letter:"Otro aniversario no es solamente contar años. Es mirar todo lo que hubo en el medio y saber que, incluso con días difíciles, sigo queriendo que lo próximo también sea con vos.",
    },
  },
  {
    slug:"propuesta",
    eyebrow:"La pregunta más importante",
    title:"Antes de preguntarte algo…",
    short:"La historia de ustedes conduce a una última puerta y una sola pregunta.",
    icon:"◇",
    accent:"#f6d58f",
    demoRecipient:"Clara",
    demoGiver:"Tomás",
    opening:"Para llegar hasta esta pregunta primero tenemos que volver a pasar por algunas cosas.",
    closing:"¿Querés casarte conmigo?",
    tags:["Propuesta","Casamiento","Pareja"],
    recipe:["intro","door","memories","light","stars","hold","vault","letter","proposal"],
    demo:{
      memories:[
        "La primera vez que pensé: ojalá esto dure mucho.",
        "Ese viaje donde empecé a imaginar una vida entera, no sólo unas vacaciones.",
        "Una mañana cualquiera en la que entendí que mi lugar favorito ya no era un lugar.",
      ],
      stars:[
        "Quiero desayunos apurados con vos.",
        "Quiero festejar las cosas enormes y también las ridículamente pequeñas.",
        "Quiero que seamos equipo cuando todo sea fácil y cuando no.",
        "Quiero seguir encontrándote en todas las versiones que nos falten vivir.",
        "Y quiero preguntarte algo que ya no me entra en el pecho.",
      ],
      letter:"No estoy buscando prometerte una vida perfecta. Estoy eligiendo una vida real con vos: los planes, los cambios, los domingos aburridos, los viajes, las discusiones, las reconciliaciones y todo lo que todavía no sabemos.",
    },
  },
  {
    slug:"mama-papa",
    eyebrow:"Para quienes estuvieron primero",
    title:"Todo lo que quizá nunca te dije",
    short:"Un recorrido de gratitud hecho con recuerdos familiares y palabras que importan.",
    icon:"❋",
    accent:"#ff9a7a",
    demoRecipient:"Mamá",
    demoGiver:"Tus hijos",
    opening:"Hay cosas que uno siente toda la vida y tarda demasiado en decir.",
    closing:"Gracias por ser casa incluso cuando estamos lejos.",
    tags:["Mamá","Papá","Gratitud"],
    recipe:["intro","memories","light","voices","stars","hold","letter","scratch","finale"],
    demo:{
      memories:[
        "Esperarnos despierta aunque dijéramos que no hacía falta.",
        "Resolver cosas imposibles como si fueran una pavada.",
        "Esos abrazos que de chicos parecían normales y de grandes entendimos todo lo que tenían.",
      ],
      voices:[
        {name:"Tu hijo mayor",message:"Ahora que crecí entiendo muchas cosas que antes simplemente daba por hechas."},
        {name:"Tu hija",message:"Gracias por seguir siendo la primera persona a la que quiero contarle algo bueno."},
        {name:"Los nietos",message:"Abu, tu casa siempre gana."},
        {name:"Todos",message:"No te lo decimos suficiente, pero gran parte de lo que somos empezó con vos."},
      ],
      stars:[
        "Tu capacidad de aparecer.",
        "Las cosas que sacrificaste sin anunciarlas.",
        "La manera de cuidarnos incluso cuando ya no hacía falta.",
        "Todo lo que aprendimos mirándote.",
        "Que todavía seguimos necesitando un poco de casa.",
      ],
      scratchEyebrow:"Vale por",
      scratchReward:"un día entero pensado para vos",
      scratchNote:"sin cocinar · sin organizar · sin preocuparte",
      letter:"De chicos creemos que los padres simplemente saben hacer todo. De grandes entendemos que muchas veces estaban aprendiendo sobre la marcha y aun así lograron hacernos sentir seguros. Gracias.",
    },
  },
  {
    slug:"amistad",
    eyebrow:"Para tu persona elegida",
    title:"El archivo secreto de nuestra amistad",
    short:"Anécdotas, papelones, fotos y mensajes que sólo ustedes entienden.",
    icon:"✹",
    accent:"#79b7ff",
    demoRecipient:"Vale",
    demoGiver:"Cami",
    opening:"Advertencia: este archivo contiene pruebas de demasiadas malas decisiones juntas.",
    closing:"Gracias por estar en todas. Incluso en las que era mejor no estar.",
    tags:["Amistad","Humor","Recuerdos"],
    recipe:["intro","quiz","memories","light","balloons","scratch","hold","letter","finale"],
    demo:{
      quiz:{
        question:"¿Quién mandó el primer mensaje después de aquella pelea absurda?",
        answers:["Yo, obviamente","Vos, pero fingiendo que no era por eso","El grupo porque nadie nos aguantaba más"],
        correctIndex:1,
        after:"Correcto. Y las dos seguimos sosteniendo una versión diferente de cómo pasó.",
      },
      memories:[
        "La noche que dijimos «una sola» y vimos amanecer.",
        "Una foto objetivamente horrible que jamás vamos a borrar.",
        "El audio de siete minutos que resolvió exactamente cero problemas pero ayudó muchísimo.",
      ],
      balloons:["Ese secreto sigue a salvo","Te debo una cena","No subas esa foto","Plan improvisado","Audio de 11 minutos","Somos un peligro"],
      scratchEyebrow:"Cupón oficial",
      scratchReward:"una salida sin derecho a cancelar",
      scratchNote:"válido incluso con fiaca",
      letter:"Podría ponerme sentimental, pero después usarías esto en mi contra. Así que sólo voy a decir que tener una persona con la que puedo ser completamente ridícula es una suerte enorme.",
    },
  },
];

export function getExperience(slug:string){ return experiences.find(x=>x.slug===slug); }
