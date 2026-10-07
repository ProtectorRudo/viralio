export type SceneType =
  | "intro" | "door" | "memories" | "stars" | "scratch" | "letter"
  | "finale" | "candles" | "balloons" | "timeline" | "voices" | "quiz"
  | "vault" | "capsule" | "proposal" | "video" | "light" | "hold"
  | "archive" | "home" | "legacy" | "rituals" | "chapters" | "future"
  | "origin" | "reasons" | "certainty" | "threshold"
  | "childhood" | "care" | "sacrifices" | "return"
  | "lessons" | "presence" | "inheritance" | "lookback"
  | "casefile" | "insidejokes" | "incidents" | "proof" | "pact";

export type DemoContent = {
  memories?: string[];
  photos?: { url:string; position?:"center"|"top"|"bottom"|"left"|"right" }[];
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
    recipe:["intro","door","memories","voices","light","stars","scratch","hold","letter","finale"],
    demo:{
      memories:[
        "El café que iba a durar media hora y terminó ocupando toda la tarde.",
        "La foto que casi no sacamos. Hoy es de mis favoritas.",
        "Ese viaje en el que nos perdimos y, por una vez, estuvo buenísimo.",
      ],
      photos:[
        {url:"https://images.unsplash.com/photo-1769624569453-57a67f094a4b?auto=format&fit=crop&fm=jpg&q=72&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1725024306231-7f8dba540ac9?auto=format&fit=crop&fm=jpg&q=72&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1719682575943-6163aed11952?auto=format&fit=crop&fm=jpg&q=72&w=1400",position:"center"},
      ],
      voices:[
        {name:"Julián",message:"No sé si alguna vez te lo dije así, pero desde que estás vos hay días comunes que se sienten distintos. Me gusta nuestra vida, incluso las partes que nadie subiría a una foto."},
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
      photos:[
        {url:"https://images.unsplash.com/photo-1763951778440-13af353b122a?auto=format&fit=crop&fm=jpg&q=74&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1733967018420-4b8964a39fb2?auto=format&fit=crop&fm=jpg&q=74&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1681716349822-33b7af89d04e?auto=format&fit=crop&fm=jpg&q=74&w=1400",position:"center"},
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
      photos:[
        {url:"https://images.unsplash.com/photo-1770261430784-5e08c7b7c803?auto=format&fit=crop&fm=jpg&q=74&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1650631939931-6858dd4d658b?auto=format&fit=crop&fm=jpg&q=74&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1774641374118-8305e055a060?auto=format&fit=crop&fm=jpg&q=74&w=1400",position:"center"},
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
    recipe:["intro","archive","timeline","memories","home","voices","letter","legacy","finale"],
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
      photos:[
        {url:"https://images.unsplash.com/photo-1758874959821-5484186a8d21?auto=format&fit=crop&fm=jpg&q=76&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1758612898635-9f1db65dfecb?auto=format&fit=crop&fm=jpg&q=76&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&fm=jpg&q=76&w=1400",position:"center"},
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
    opening:"No quiero celebrar solamente el día en que empezamos. Quiero celebrar todo lo que fuimos construyendo después.",
    closing:"Feliz nosotros. Por todo lo que fuimos, por todo lo que somos y por todo lo que todavía nos falta construir.",
    tags:["Aniversario","Pareja","Recuerdos"],
    recipe:["intro","timeline","memories","rituals","chapters","letter","future","finale"],
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
      photos:[
        {url:"https://images.unsplash.com/photo-1776266100976-87661a787a9c?auto=format&fit=crop&fm=jpg&q=78&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1782787542614-7dece643af6d?auto=format&fit=crop&fm=jpg&q=78&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1776266099419-dde2d16f4df6?auto=format&fit=crop&fm=jpg&q=78&w=1400",position:"center"},
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
    short:"Un recorrido íntimo por las razones, la certeza y todo lo que lleva a una sola pregunta.",
    icon:"◇",
    accent:"#f6d58f",
    demoRecipient:"Clara",
    demoGiver:"Tomás",
    opening:"Hay algo que quiero preguntarte. Pero antes necesito que vuelvas conmigo a algunas cosas que me trajeron hasta acá.",
    closing:"¿Querés casarte conmigo?",
    tags:["Propuesta","Casamiento","Pareja"],
    recipe:["intro","origin","memories","reasons","certainty","letter","threshold","proposal"],
    demo:{
      memories:[
        "La primera vez que pensé: ojalá esto dure mucho.",
        "Ese viaje donde empecé a imaginar una vida entera, no sólo unas vacaciones.",
        "Una mañana cualquiera en la que entendí que mi lugar favorito ya no era un lugar.",
      ],
      photos:[
        {url:"https://images.unsplash.com/photo-1775717522396-5d56c0c9aeae?auto=format&fit=crop&fm=jpg&q=78&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1763129636696-0bda22154cf7?auto=format&fit=crop&fm=jpg&q=78&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1763129636465-f4016848a06f?auto=format&fit=crop&fm=jpg&q=78&w=1400",position:"center"},
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
    slug:"mama",
    eyebrow:"Para la mujer que estuvo antes que todos",
    title:"Todo lo que hiciste sin pedir aplausos",
    short:"Una experiencia sobre infancia, cuidado, gestos invisibles y ese lugar al que siempre se puede volver.",
    icon:"✿",
    accent:"#e8a99b",
    demoRecipient:"Mamá",
    demoGiver:"Tus hijos",
    opening:"Hay una edad en la que uno cree que mamá puede con todo. Después uno crece y empieza a entender cuánto había detrás.",
    closing:"Gracias por ser hogar mucho antes de que supiéramos todo lo que esa palabra significaba.",
    tags:["Mamá","Gratitud","Infancia"],
    recipe:["intro","childhood","memories","care","sacrifices","voices","letter","finale"],
    // release-mama-flow: return scene removed
    demo:{
      memories:[
        "La comida servida, la ropa lista y esa forma tuya de hacer que lo cotidiano se sintiera cuidado.",
        "Esperarnos despierta aunque dijéramos que no hacía falta. Hoy sabemos que era otra forma de decir «estoy acá».",
        "Esos abrazos que de chicos parecían normales y hoy sabemos que eran una de las formas más simples de sentirnos en casa.",
      ],
      photos:[
        {url:"https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&fm=jpg&q=76&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1589169011402-8b2cbd1ee593?auto=format&fit=crop&fm=jpg&q=76&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1501886564641-e55a61b1f5da?auto=format&fit=crop&fm=jpg&q=76&w=1400",position:"center"},
      ],
      voices:[
        {name:"Tu hijo mayor",message:"Ahora que crecí entiendo muchas cosas que antes simplemente daba por hechas."},
        {name:"Tu hija",message:"Gracias por seguir siendo la primera persona a la que quiero contarle algo bueno."},
        {name:"Todos",message:"Si alguna vez dudás de todo lo que hiciste bien, miranos: hay muchísimas cosas tuyas viviendo en nosotros."},
      ],
      letter:"De chicos veíamos todo lo que hacías, pero no siempre entendíamos lo que había detrás. Hoy sí. Y también entendemos algo más: no sólo nos cuidaste; nos enseñaste, con miles de gestos pequeños, cómo se quiere a alguien de verdad. Mucho de lo bueno que hay en nosotros empezó con vos. Gracias por ser mamá, pero también gracias por ser vos.",
    },
  },
  {
    slug:"papa",
    eyebrow:"Para papá · esas cosas que uno entiende cuando crece",
    title:"Todo eso tuyo que se nos quedó",
    short:"Recuerdos, frases, pequeñas costumbres y esas cosas que de chicos parecían normales… hasta que un día entendimos lo que había atrás.",
    icon:"⌁",
    accent:"#a9b7c9",
    demoRecipient:"Papá",
    demoGiver:"Tus hijos",
    opening:"Durante años pensamos que vos sabías qué hacer. Después crecimos y descubrimos algo bastante más lindo: muchas veces también estabas aprendiendo sobre la marcha. Igual estabas ahí. Y recién ahora entendemos lo que eso significa.",
    closing:"Te queremos. Y sí: al final aprendimos bastante más de vos de lo que pensábamos.",
    tags:["Papá","Recuerdos","Gracias"],
    recipe:["intro","memories","lessons","presence","inheritance","voices","letter","lookback","finale"],
    demo:{
      memories:[
        "La bici. Vos sosteniendo y nosotros convencidos de que no ibas a soltar nunca. La soltaste un segundo antes de que nos diéramos cuenta. Bastante buen resumen de muchas cosas, ahora que lo pensamos.",
        "Las veces que nos llevaste, nos fuiste a buscar o esperaste sin hacer demasiado ruido. En ese momento era “papá me lleva”. Hoy sabemos que también era tiempo, cansancio y ganas de estar.",
        "Tus consejos. Los mismos que escuchábamos con cara de “sí, sí”. Qué incómodo admitir que varios tenían razón.",
      ],
      photos:[
        {url:"https://images.unsplash.com/photo-1644941002474-6ee8ab0ee8cb?auto=format&fit=crop&fm=jpg&q=76&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1582236158876-7e6a7410bcee?auto=format&fit=crop&fm=jpg&q=76&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1590527548172-295fdcb1bab0?auto=format&fit=crop&fm=jpg&q=76&w=1400",position:"center"},
      ],
      voices:[
        {name:"Vale",message:"Pa, hay algo que te tengo que admitir: varias de esas cosas que me decías y yo escuchaba a medias… me quedaron. Y hoy las entiendo bastante más."},
        {name:"Lucas",message:"Me descubrí diciendo una frase tuya el otro día. Primero me dio risa. Después pensé: bueno… parece que sí te estaba prestando atención."},
        {name:"Todos",message:"Gracias por estar, incluso en las épocas en las que éramos bastante difíciles de acompañar. Ahora vemos mucho mejor todo lo que hiciste sin hacer ruido."},
      ],
      letter:"De chicos pensábamos que ser papá era saber qué hacer. Como si los adultos vinieran con un manual y vos hubieras conseguido el tuyo antes de que naciéramos. Ahora sabemos que no. Y nosotros tampoco veníamos con instrucciones, por si sirve de consuelo. Sabemos que muchas veces estabas cansado, preocupado o resolviendo sobre la marcha. Y aun así aparecías: en los viajes, en las esperas, en los consejos que no queríamos escuchar, en ese “avisame cuando llegues”, en las veces que te tocó hacerte cargo sin que nadie aplaudiera. No hiciste todo perfecto. Nosotros tampoco te lo hicimos fácil. Pero cuando miramos para atrás hay algo que se ve clarísimo: estuviste. Y muchas de las cosas buenas con las que hoy enfrentamos la vida empezaron mirándote a vos. Te queremos, Pa. Mucho más de lo que probablemente decimos.",
    },
  },
  {
    slug:"amistad",
    eyebrow:"Archivo confidencial · sólo para ustedes",
    title:"Expediente: nuestra amistad",
    short:"Pruebas, códigos secretos, malas decisiones y todo eso que convirtió una amistad en parte de la vida.",
    icon:"✹",
    accent:"#79b7ff",
    demoRecipient:"Vale",
    demoGiver:"Cami",
    opening:"Antes de que esto se ponga sentimental, considero necesario dejar constancia oficial de demasiadas cosas que hicimos.",
    closing:"Entre todas las personas que la vida podía cruzarme, qué suerte que me tocaste vos.",
    tags:["Amistad","Humor","Recuerdos"],
    recipe:["intro","casefile","memories","insidejokes","incidents","proof","letter","pact","finale"],
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
      photos:[
        {url:"https://images.unsplash.com/photo-1755705153160-67b29c7718ee?auto=format&fit=crop&fm=jpg&q=78&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&fm=jpg&q=78&w=1400",position:"center"},
        {url:"https://images.unsplash.com/photo-1772723246474-60568f39cbd9?auto=format&fit=crop&fm=jpg&q=78&w=1400",position:"center"},
      ],
      balloons:["Ese secreto sigue a salvo","Te debo una cena","No subas esa foto","Plan improvisado","Audio de 11 minutos","Somos un peligro"],
      scratchEyebrow:"Cupón oficial",
      scratchReward:"una salida sin derecho a cancelar",
      scratchNote:"válido incluso con fiaca",
      letter:"Podría ponerme sentimental, pero después usarías esto en mi contra. Así que sólo voy a decir que tener una persona con la que puedo ser completamente ridícula es una suerte enorme.",
    },
  },
];

export function getExperience(slug:string){
  if(slug==="mama-papa") return experiences.find(x=>x.slug==="mama");
  return experiences.find(x=>x.slug===slug);
}
