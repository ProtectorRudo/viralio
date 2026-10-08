import type { Experience, SceneType } from "./data";
import { premiumMoments } from "./premiumMoments";

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<U>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

type VoiceEntry = { name:string; message:string };
type TimelineEntry = { title:string; body:string };

export type ExperienceCopy = {
  ui: {
    sceneLabels: Record<SceneType,string>;
    resetLabel:string;
    resetAria:string;
    previousAria:string;
    nextAria:string;
    createdWith:string;
  };
  intro: { kicker:string; title:string; lead:string; cta:string; footnote:string };
  door: { kicker:string; title:string[]; closedHint:string; openCta:string };
  memories: { kicker:string; title:string[]; items:string[]; cta:string };
  light: { kicker:string; title:string; secret:string; hint:string; revealedLabel:string; cta:string; ariaLabel:string };
  stars: { kicker:string; title:string[]; items:string[]; hiddenLabel:string; completeLabel:string; remainingOne:string; remainingMany:string; cta:string };
  scratch: { kicker:string; title:string[]; eyebrow:string; reward:string; note:string; coverTitle:string; coverHint:string; fallbackLabel:string; cta:string };
  hold: { kicker:string; title:string[]; prompt:string; reveal:string; instruction:string; cta:string; symbol:string };
  letter: { kicker:string; title:string[]; body:string; recipientLabel:string; signature:string; sealHint:string; cta:string };
  candles: { kicker:string; title:string[]; micIdle:string; micActive:string; tapFallback:string; tapUnavailable:string; wishLabel:string; cta:string };
  balloons: { kicker:string; title:string[]; items:string[]; remainingOne:string; remainingMany:string; cta:string; popLabel:string };
  timeline: { kicker:string; title:string[]; entries:TimelineEntry[]; cta:string };
  voices: { kicker:string; title:string[]; intro:string; cardIntros:string[]; entries:VoiceEntry[]; noteLabel:string; playLabel:string; playingLabel:string; outroTitle:string; outroBody:string; cta:string };
  quiz: { kicker:string; question:string; answers:string[]; correctIndex:number; after:string; cta:string };
  vault: { kicker:string; title:string[]; closedLabel:string; openLabel:string; closedSmall:string; openSmall:string; reveal:string; cta:string };
  capsule: { kicker:string; title:string[]; year:string; closed:string; open:string; closedLabel:string; openLabel:string; cta:string };
  video: { kicker:string; title:string[]; placeholder:string; cta:string };
  lessons: { kicker:string; title:string; accentTitle:string; titleTail:string; items:string[]; closedLabel:string; outroTitle:string; outroBody:string; cta:string };
  presence: { kicker:string; title:string; subtitle:string; items:string[]; closedLabel:string; outroTitle:string; outroBody:string; cta:string };
  inheritance: { kicker:string; title:string; subtitle:string; items:string[]; closedLabel:string; outroTitle:string; outroBody:string; cta:string };
  lookback: { kicker:string; closedTitle:string; openTitle:string; openLabel:string; cta:string };
  finale: { kicker:string; title:string; lead:string; reactions:string[]; restartLabel:string; createdWith:string };
  proposal: { kicker:string; title:string; lead:string; reactions:string[]; createdWith:string };
};

const BASE_COPY: ExperienceCopy = {
  ui:{
    sceneLabels:{
      intro:"Comienzo",door:"Puerta",memories:"Recuerdos",stars:"Estrellas",scratch:"Sorpresa",
      letter:"Carta",finale:"Final",candles:"Deseo",balloons:"Mensajes",timeline:"Historia",
      voices:"Voz",quiz:"Pregunta",vault:"Bóveda",capsule:"Futuro",proposal:"La pregunta",
      video:"Video",light:"Instante",hold:"Promesa",
      archive:"Archivo",home:"La casa",legacy:"Legado",rituals:"Rituales",chapters:"Capítulos",future:"Lo que sigue",
      origin:"Origen",reasons:"Razones",certainty:"Certeza",threshold:"Umbral",
      childhood:"Infancia",care:"Cuidados",sacrifices:"Lo invisible",return:"Volver",
      lessons:"Lecciones",presence:"Presencia",inheritance:"Herencia",lookback:"Mirar de nuevo",
      casefile:"Expediente",insidejokes:"Códigos",incidents:"Antecedentes",proof:"Pruebas",pact:"Pacto",
    },
    resetLabel:"Reiniciar",resetAria:"Reiniciar experiencia",previousAria:"Escena anterior",
    nextAria:"Escena siguiente",createdWith:"creado con ♥ en Te Hice Esto",
  },
  intro:{kicker:"{giver} hizo algo para vos",title:"{recipient}",lead:"{opening}",cta:"Entrar",footnote:"Mejor con auriculares · unos minutos sólo para vos"},
  door:{kicker:"Hay algo del otro lado",title:["Todo empieza abriendo una puerta."],closedHint:"Tocá la puerta",openCta:"Entrar →"},
  memories:{kicker:"Los recuerdos",title:["Hay días que terminan.","Y otros que se quedan."],items:[],cta:"Seguir →"},
  light:{kicker:"Un instante",title:"Encontrá lo que quedó acá.",secret:"Hay recuerdos que vuelven con otra luz.",hint:"Mové la luz y tocá para revelar",revealedLabel:"recuerdo revelado ✦",cta:"Seguir con este recuerdo →",ariaLabel:"Revelar recuerdo con luz"},
  stars:{kicker:"Cosas que no quiero que olvides",title:["Tocá las estrellas."],items:[],hiddenLabel:"Tocame",completeLabel:"constelación descubierta",remainingOne:"Descubrí 1 más",remainingMany:"Descubrí {count} más",cta:"Continuar →"},
  scratch:{kicker:"Hay algo escondido",title:["Esto sí tenés que descubrirlo."],eyebrow:"Vale por",reward:"un recuerdo nuevo juntos",note:"sin vencimiento",coverTitle:"RASPÁ PARA DESCUBRIR",coverHint:"con el dedo o el mouse",fallbackLabel:"revelar sin raspar",cta:"Ya lo descubrí →"},
  hold:{kicker:"Antes de seguir",title:["Hay cosas que merecen","un segundo más."],prompt:"Mantené el símbolo",reveal:"Esto también quería decírtelo.",instruction:"mantené apretado",cta:"Seguir →",symbol:"♥"},
  letter:{kicker:"La parte que no podía entrar en una foto",title:["Hay palabras que merecen","abrirse despacio."],body:"Gracias por convertir tantos días comunes en recuerdos extraordinarios.",recipientLabel:"Para {recipient}",signature:"— {giver}",sealHint:"Rompé el sello",cta:"Guardar estas palabras →"},
  candles:{kicker:"Pedí un deseo",title:["Antes de seguir,","faltan las velitas."],micIdle:"Soplar de verdad",micActive:"Soplá ahora…",tapFallback:"o apagarlas tocando",tapUnavailable:"Apagar tocando",wishLabel:"✦ deseo guardado",cta:"Seguir →"},
  balloons:{kicker:"No todos los globos están vacíos",title:["Reventá tres."],items:[],remainingOne:"Falta 1",remainingMany:"Faltan {count}",cta:"Continuar →",popLabel:"POP"},
  timeline:{kicker:"El tiempo también cuenta historias",title:["Tres momentos.","Una misma historia."],entries:[],cta:"Seguir la historia →"},
  voices:{kicker:"Hay gente esperando decirte algo",title:["Elegí una voz."],intro:"",cardIntros:[],entries:[],noteLabel:"nota de voz · {name}",playLabel:"Tocá para escuchar",playingLabel:"Reproduciendo…",outroTitle:"",outroBody:"",cta:"Continuar →"},
  quiz:{kicker:"A ver cuánto te acordás",question:"¿Dónde empezó esta historia?",answers:["En un mensaje","En una salida que casi se cancela","En un lugar que ya no existe"],correctIndex:1,after:"La respuesta importa menos que todo lo que vino después.",cta:"Seguir →"},
  vault:{kicker:"Última cerradura",title:["Hay algo guardado para vos."],closedLabel:"TOCÁ PARA ABRIR",openLabel:"ABIERTO",closedSmall:"último secreto",openSmall:"acceso concedido",reveal:"No era un objeto. Era una pregunta.",cta:"Abrir la última carta →"},
  capsule:{kicker:"Para volver algún día",title:["Guardamos algo para","tu yo del futuro."],year:"2036",closed:"Hay palabras que pueden esperar.",open:"Ojalá sigas teniendo esa misma curiosidad por el mundo.",closedLabel:"Abrir cápsula",openLabel:"Abriste una cápsula del tiempo",cta:"Guardar este momento →"},
  video:{kicker:"Un momento para mirar sin apuro",title:["Hay recuerdos que necesitan","movimiento y sonido."],placeholder:"Un video especial vive acá",cta:"Continuar →"},
  lessons:{
    kicker:"Todo lo que me enseñaste sin dar una clase",
    title:"Muchas lecciones tuyas tardaron años en cobrar sentido.",
    accentTitle:"",
    titleTail:"",
    items:[
      "Resolver | No saber no era una excusa para quedarse quieto. Primero se mira, se prueba, se pregunta y se vuelve a intentar.",
      "Cumplir | Llegar, llamar, hacerse cargo, sostener la palabra incluso cuando nadie está mirando.",
      "Cuidar | Entendí que proteger no siempre es hablar. A veces es estar cerca, prever, acompañar y dejar que el otro intente.",
      "Seguir | Hay días en los que el coraje se parece menos a una hazaña y más a levantarse y hacer lo que toca."
    ],
    closedLabel:"Abrir lección",
    outroTitle:"Y un día entendí algo más:",
    outroBody:"Muchas de esas cosas ya estaban viviendo en mí.",
    cta:"Seguir"
  },
  presence:{
    kicker:"Las formas de estar",
    title:"No todos los recuerdos importantes tienen una conversación.",
    subtitle:"",
    items:[
      "LA MANO | La que sostenía la bici, señalaba cómo hacerlo o aparecía en un hombro cuando hacía falta.",
      "LA ESPERA | Quedarte hasta que terminara. Ir a buscarme. Esperar despierto. Estar cuando volvía.",
      "LA MIRADA | Ese gesto que podía decir “bien”, “ojo”, “seguí” o “estoy acá” sin una sola palabra."
    ],
    closedLabel:"Tocá para recordar",
    outroTitle:"Y un día lo entendí:",
    outroBody:"Muchas veces no estabas diciendo ‘te quiero’. Lo estabas haciendo.",
    cta:"Ver lo que quedó"
  },
  inheritance:{
    kicker:"La herencia que no se firma",
    title:"Hay cosas tuyas que un día descubrí viviendo en mí.",
    subtitle:"",
    items:[
      "LA FORMA DE MIRAR UN PROBLEMA | Antes de pedir ayuda, trato de entender cómo funciona.",
      "ALGUNAS FRASES | Juraba que nunca las iba a decir. Ahora salen solas.",
      "CIERTOS GESTOS | Maneras de ordenar, manejar, cocinar, arreglar o pensar que aparecieron sin permiso.",
      "UNA PARTE DE TU CARÁCTER | No todo. Pero lo suficiente como para reconocerte en mí de vez en cuando."
    ],
    closedLabel:"Revelar",
    outroTitle:"Capaz heredar de verdad sea esto.",
    outroBody:"No quedarse con las cosas de alguien. Sino descubrirlo, años después, viviendo un poco en uno mismo.",
    cta:"Escuchar a la familia"
  },
  lookback:{
    kicker:"Ahora te miro distinto",
    closedTitle:"Hay una parte de crecer que también es volver a conocer a nuestros padres.",
    openTitle:"Con el tiempo dejé de verte sólo como “papá”. Empecé a ver también al hombre que estaba haciendo lo mejor que podía con lo que tenía.",
    openLabel:"Mirar de nuevo",
    cta:"Una última cosa"
  },
  finale:{kicker:"Una última cosa",title:"{closing}",lead:"Este lugar va a seguir acá para cuando quieras volver.",reactions:["🥹","❤️","😭","✨"],restartLabel:"Volver al comienzo",createdWith:"creado con ♥ en Te Hice Esto"},
  proposal:{kicker:"Y ahora sí",title:"{closing}",lead:"No hace falta tocar nada más. Este momento es de ustedes.",reactions:["Sí ❤️","😭","✨"],createdWith:"creado con ♥ en Te Hice Esto"},
};

const DEMO_OVERRIDES: Record<string, DeepPartial<ExperienceCopy>> = {
  pareja:{
    ui:{sceneLabels:{intro:"Para vos",door:"Umbral",memories:"Nosotros",voices:"Tu voz",light:"Ese instante",stars:"Lo que elijo",scratch:"Pendiente",hold:"Quedate",letter:"Lo que faltaba",finale:"Nosotros"} as Record<SceneType,string>},
    intro:{kicker:"{giver} armó esto pensando en vos",cta:"Entrá despacio",footnote:"Lo nuestro también merecía un lugar así."},
    door:{kicker:"No todo empieza con una fecha",title:["A veces empieza","con animarse a entrar."],closedHint:"Abrila cuando quieras",openCta:"Seguir entrando →"},
    memories:{kicker:"Tres momentos que todavía me acuerdo perfecto",title:["Pasaron hace tiempo.","Pero siguen siendo nuestros."],cta:"Hay algo más →"},
    voices:{kicker:"No quería escribir todo",title:["Esta parte preferí","decírtela."],noteLabel:"nota de voz · {name}",playLabel:"Escuchar su voz",playingLabel:"Esto era lo que quería decirte",cta:"Guardar esta voz →"},
    light:{kicker:"Hay un recuerdo que siempre vuelve",title:"Encontralo.",secret:"No recuerdo exactamente qué dijimos. Sí recuerdo que no quería que terminara.",hint:"Deslizá el dedo por la oscuridad.",revealedLabel:"Quedate un segundo acá.",cta:"Seguir con este recuerdo →"},
    stars:{kicker:"Cinco cosas muy tuyas",title:["Hay cosas tuyas","que siempre elegiría."],hiddenLabel:"descubrir",completeLabel:"cinco cosas tuyas",cta:"Me las guardo →"},
    scratch:{kicker:"Una deuda pendiente, oficialmente",title:["Esto no podía quedar","solamente en palabras."],coverTitle:"RASPÁ DESPACIO",coverHint:"hay un plan abajo",fallbackLabel:"abrir igual",cta:"Acepto el trato →"},
    hold:{kicker:"Quedate un segundo acá",title:["Antes de la carta,","quiero que sientas esto."],instruction:"no lo sueltes todavía",cta:"Ahora sí →"},
    letter:{kicker:"Esto sí necesitaba palabras",title:["No quería mandártelo","en un mensaje cualquiera."],sealHint:"Abrí la carta",cta:"Quiero seguir →"},
    finale:{kicker:"Por si alguna vez dudás",lead:"Lo demás lo seguimos haciendo afuera de esta pantalla.",restartLabel:"Volver a nosotros"},
  },
  cumpleanos:{
    intro:{kicker:"Hoy hubo gente que quiso hacer algo más que saludarte",cta:"Empezar mi cumpleaños",footnote:"Prometemos no cantar todos al mismo tiempo"},
    candles:{kicker:"Primero, lo obvio",title:["Pedí un deseo.","Pero uno bueno."],wishLabel:"✦ listo, no lo cuentes",cta:"Ahora sí →"},
    balloons:{kicker:"Algunos globos vienen con condiciones",title:["Reventá tres.","Después no digas que no avisamos."],popLabel:"TOCÁ",remainingOne:"Queda 1",remainingMany:"Quedan {count}",cta:"Seguir festejando →"},
    memories:{kicker:"Pruebas de que ya vivimos bastante",title:["Fotos que explican","por qué te queremos."],cta:"Escuchá esto →"},
    light:{kicker:"Otra vuelta al sol",title:"Mirá todo lo que iluminaste.",revealedLabel:"esto también es tuyo ✦",cta:"Seguir →"},
    voices:{kicker:"Tu gente tenía cosas para decir",title:["Elegí una voz.","Después otra."],playLabel:"Escuchar mensaje",playingLabel:"mensaje abierto",cta:"Guardar estos mensajes →"},
    hold:{kicker:"Un deseo que no entra en una vela",title:["Este no lo pedís vos.","Lo pedimos nosotros."],instruction:"mantené la estrella",cta:"Recibirlo →"},
    letter:{kicker:"La parte sin chistes",title:["Porque también queríamos","decirte esto en serio."],sealHint:"Abrir",cta:"Guardar →"},
    finale:{kicker:"Feliz vuelta al sol",lead:"Que el próximo año traiga historias que todavía no sabemos contar.",restartLabel:"Volver a festejar"},
  },
  hijos:{
    intro:{kicker:"Lo guardamos antes de que puedas acordarte",cta:"Abrir mis recuerdos",footnote:"Hecho por quienes te miraron crecer desde el primer día"},
    timeline:{kicker:"Antes de que el tiempo corra más",title:["Tres momentos.","Y miles que quedaron afuera."],cta:"Seguir creciendo →"},
    memories:{kicker:"Cosas pequeñas que no queremos perder",title:["Hoy parecen normales.","Algún día van a ser enormes."],cta:"Guardar otro →"},
    light:{kicker:"Un instante que un día va a parecer lejano",title:"Guardamos esto también.",revealedLabel:"momento guardado ✦",cta:"Seguir →"},
    stars:{kicker:"Lo que ya vemos en vos",title:["Antes de saber quién vas a ser,","ya hay cosas que admiramos."],hiddenLabel:"mirar",completeLabel:"tres cosas tuyas",cta:"Quiero ver más →"},
    capsule:{kicker:"Esto no es para hoy",title:["Es para una versión tuya","que todavía no conocemos."],closedLabel:"Abrir cápsula",openLabel:"Mensaje desde acá",cta:"Volver al presente →"},
    hold:{kicker:"Una promesa para cuando crezcas",title:["No importa cuántos años pasen.","Esto no cambia."],instruction:"mantené el sol",cta:"Seguir →"},
    letter:{kicker:"Para que algún día puedas leerlo",title:["Hay cosas que queremos","dejar por escrito."],sealHint:"Abrir cuando quieras",cta:"Guardar conmigo →"},
    finale:{kicker:"Para tu yo de hoy y el de mañana",lead:"Este lugar va a crecer de significado a medida que vos también crezcas.",restartLabel:"Volver al principio"},
  },
  abuelos:{
    intro:{kicker:"Una familia entera quiso volver a escucharte",cta:"Entrar al archivo",footnote:"Hay historias que merecen más que una caja de fotos"},
    timeline:{kicker:"Antes de nosotros ya había una historia",title:["Años que pasaron.","Cosas que siguen acá."],cta:"Abrir el siguiente recuerdo →"},
    memories:{kicker:"El álbum que todos llevamos en la cabeza",title:["La mesa, la casa,","las cosas de siempre."],cta:"Seguir recordando →"},
    light:{kicker:"La memoria también tiene luz",title:"Acercate un poco.",revealedLabel:"recuerdo encontrado ✦",cta:"Guardar →"},
    voices:{kicker:"Hay voces de esta familia esperando",title:["Escuchá lo que dejaste","en cada uno."],playLabel:"Escuchar",playingLabel:"escuchando",cta:"Seguir →"},
    stars:{kicker:"Cosas tuyas que heredamos sin darnos cuenta",title:["Gestos, frases, costumbres.","Todo eso también queda."],hiddenLabel:"recordar",completeLabel:"parte de tu legado",cta:"Seguir →"},
    hold:{kicker:"Lo que queda después de tantos años",title:["No se guarda en una caja.","Se queda en nosotros."],instruction:"mantené este instante",cta:"Abrir la carta →"},
    letter:{kicker:"De toda tu familia",title:["Esto no entra","en una sola foto."],sealHint:"Abrir despacio",cta:"Guardar estas palabras →"},
    finale:{kicker:"Gracias por haber empezado esta historia",lead:"Muchas de nuestras formas de querer empezaron mirándote a vos.",restartLabel:"Volver al archivo"},
  },
  aniversario:{
    intro:{kicker:"Otro año no alcanza para contar todo",cta:"Volver al comienzo",footnote:"No es un resumen. Es una pausa para mirar lo que hicimos juntos"},
    timeline:{kicker:"No pasó de golpe",title:["Nos fuimos convirtiendo","en nosotros."],cta:"Seguir el hilo →"},
    memories:{kicker:"Escenas sin aniversario ni fecha especial",title:["La vida real.","La que más extraño cuando no estás."],cta:"Seguir →"},
    light:{kicker:"Un día común que terminó importando",title:"Volvé a ese momento.",revealedLabel:"todavía sigue acá ✦",cta:"Seguir →"},
    quiz:{kicker:"Una prueba para los dos",cta:"Sí, me acuerdo →"},
    scratch:{kicker:"Lo próximo todavía no pasó",title:["Pero ya tiene","un lugar reservado."],coverTitle:"PRÓXIMO CAPÍTULO",coverHint:"raspá para verlo",fallbackLabel:"saltear suspenso",cta:"Me anoto →"},
    hold:{kicker:"El próximo capítulo",title:["No quiero repetir los años.","Quiero estrenarlos con vos."],instruction:"mantené el infinito",cta:"Abrir la carta →"},
    letter:{kicker:"Lo que significa seguir eligiendo",title:["No perfecto.","Nuestro."],sealHint:"Abrir",cta:"Seguir juntos →"},
    finale:{kicker:"Feliz nosotros",lead:"No sé cómo van a ser los próximos años. Sí sé con quién quiero averiguarlo.",restartLabel:"Volver al comienzo"},
  },
  propuesta:{
    intro:{kicker:"Antes de una pregunta, hay una historia",cta:"Empezar",footnote:"Tomate tu tiempo · no hay nada que apurar acá"},
    door:{kicker:"Hay una decisión del otro lado",title:["Antes de abrirla,","acordate de cómo llegamos hasta acá."],closedHint:"Cuando estés lista",openCta:"Entrar →"},
    memories:{kicker:"Momentos en los que empecé a imaginarlo",title:["Primero fue una idea.","Después dejó de serlo."],cta:"Seguir →"},
    light:{kicker:"Hubo un momento exacto",title:"Encontralo.",revealedLabel:"ahí empezó ✦",cta:"Seguir →"},
    stars:{kicker:"No son votos todavía",title:["Son las cosas","que sí quiero prometer."],hiddenLabel:"leer",completeLabel:"tres promesas",cta:"Seguir →"},
    hold:{kicker:"No lo sueltes todavía",title:["Quiero que este segundo","dure un poco más."],instruction:"mantené el símbolo",cta:"Abrir la última puerta →"},
    vault:{kicker:"La última cerradura",title:["Después de esto","queda una sola pregunta."],closedLabel:"ABRIR",openLabel:"LISTO",closedSmall:"último secreto",openSmall:"ya sabés que viene algo",reveal:"No era un regalo. Era una decisión.",cta:"Estoy lista →"},
    letter:{kicker:"Antes de preguntarte",title:["Quiero que sepas","qué estoy eligiendo."],sealHint:"Abrir la carta",cta:"Ahora sí →"},
    proposal:{kicker:"Ahora sí",lead:"No hace falta tocar nada más. Mirá a la persona que tenés enfrente.",createdWith:"este momento empezó en Te Hice Esto"},
  },
  mama:{
    intro:{kicker:"Tus hijos hicieron algo para vos",cta:"Abrir esto",footnote:""},
    memories:{kicker:"Recuerdos",title:["Algunos momentos terminan.","Otros se quedan."],cta:"Seguir con la historia →"},
    letter:{kicker:"Hay palabras que merecían llegar hasta acá",title:["Después de entender tantas cosas,","quedaba decirte esto."],sealHint:"Deslizá para abrir",cta:"Guardar estas palabras →"},
    finale:{kicker:"Por si alguna vez dudás",title:"{closing}",lead:"Mirá todo lo que construiste. Mucho de lo bueno que hay en nosotros empezó con vos, y todavía sigue creciendo.",restartLabel:"Volver a sentirlo",createdWith:"hecho con amor en Te Hice Esto"},
  },
  "mama-papa":{
    intro:{kicker:"Hay gracias que tardamos demasiado en decir",cta:"Entrar",footnote:"Esto no reemplaza un abrazo. Pero quería dejarlo escrito"},
    memories:{kicker:"Cosas que de chicos parecían normales",title:["De grandes entendimos","todo lo que había atrás."],cta:"Seguir →"},
    light:{kicker:"Algo que antes no veíamos",title:"Ahora se entiende distinto.",revealedLabel:"ahora lo vemos ✦",cta:"Seguir →"},
    voices:{kicker:"Tus hijos querían decírtelo ellos",title:["Escuchá una voz.","Después otra."],playLabel:"Escuchar",playingLabel:"mensaje abierto",cta:"Guardar estas voces →"},
    stars:{kicker:"Cosas que aprendimos mirándote",title:["No las enseñaste con palabras.","Las vimos."],hiddenLabel:"descubrir",completeLabel:"tres cosas que quedaron",cta:"Seguir →"},
    hold:{kicker:"Una palabra que a veces llega tarde",title:["Hoy entendemos más.","Y queremos decir gracias."],instruction:"mantené el corazón",cta:"Abrir la carta →"},
    letter:{kicker:"Esto sí queríamos dejarlo escrito",title:["Porque algún día","también vamos a necesitar volver."],sealHint:"Abrir",cta:"Guardar →"},
    scratch:{kicker:"Ahora te toca a vos",title:["Una vez, por favor,","dejá que te cuidemos."],coverTitle:"ESTO ES PARA VOS",coverHint:"raspá para descubrir",fallbackLabel:"abrir regalo",cta:"Acepto →"},
    finale:{kicker:"Gracias por ser casa",lead:"Incluso cuando todos crecimos, hay lugares a los que seguimos volviendo.",restartLabel:"Volver"},
  },
  papa:{
    intro:{
      kicker:"Pa, te hicimos algo",
      cta:"Entrar",
      footnote:"Ponete auriculares si podés · y bancanos unos minutos, que hoy nos pusimos un poco sentimentales"
    },
    memories:{
      kicker:"Tres cosas que antes dábamos por hechas",
      title:["En ese momento eran cosas normales.","Ahora no tanto."],
      cta:"Seguir. Hay más →"
    },
    lessons:{
      kicker:"Cosas que aprendimos sin sentarnos a aprenderlas",
      title:"Resulta que sí te estábamos mirando.",
      accentTitle:"Aunque hiciéramos cara de que no.",
      titleTail:"",
      items:[
        "Cuando algo no salía | Mirabas, probabas, refunfuñabas un poco y volvías a intentar. No era una charla motivacional. Era verte no rendirte. Y algo de eso se nos quedó.",
        "Cuando había que estar | Ir a buscar. Esperar. Llegar aunque estuvieras cansado. Preguntar si habíamos llegado bien. En ese momento parecía normal. Hoy sabemos que no lo era.",
        "Cuando no sabías qué decir | No siempre había palabras. A veces había una mano, una pregunta medio torpe o simplemente quedarte cerca. Y, aunque no lo supiéramos decir, alcanzaba.",
        "Cuando tocaba seguir | Te vimos cansado más de una vez. También te vimos levantarte al día siguiente y hacer lo que había que hacer. Nunca dijiste que eso fuera una lección. Igual la aprendimos."
      ],
      closedLabel:"Abrir esto",
      outroTitle:"Qué raro admitirlo ahora:",
      outroBody:"Mientras nosotros creíamos que no estábamos prestando atención, te estábamos mirando todo el tiempo.",
      cta:"Seguir. Falta bastante por admitir →"
    },
    presence:{
      kicker:"Esas veces en las que estabas",
      title:"A veces no decías nada. Pero estabas.",
      subtitle:"Y eso, de grandes, pesa distinto.",
      items:[
        "ESPERAR | Afuera de algún lugar, en el auto o despierto hasta que volviéramos. En ese momento era simplemente “papá está ahí”. Hoy entendemos todo lo que había en eso.",
        "APARECER | A veces con una solución. A veces sin ninguna. Pero aparecías. Y uno tarda bastante en entender lo importante que es tener a alguien que hace eso.",
        "ESA MIRADA | La que podía decir “bien”, “ojo”, “ni se te ocurra” y, de alguna manera, también “confío en vos”. Bastante eficiente, la verdad."
      ],
      closedLabel:"Tocá para abrir",
      outroTitle:"Ahora sabemos algo que antes no.",
      outroBody:"No siempre dijiste “te quiero” con palabras. Pero ya aprendimos todas las otras formas en que lo decías.",
      cta:"Seguir →"
    },
    inheritance:{
      kicker:"Lo más raro de crecer",
      title:"Empezamos a encontrarte en nosotros.",
      subtitle:"Y no, no hablamos sólo de esas frases que juramos que nunca íbamos a repetir.",
      items:[
        "Un día reaccioné como vos y me quedé pensando. | La forma de frenar, mirar el problema y no salir corriendo. Antes la veía en vos. Ahora, a veces, me sale sola.",
        "Sí. Ya estamos diciendo algunas de tus frases. | Las mismas que escuchábamos con cara de “bueno, papá”. No vamos a nombrarlas todas porque tampoco queremos darte tanta satisfacción.",
        "También heredamos cosas que nunca nos enseñaste en voz alta. | La forma de preocuparte sin hacer demasiado ruido. De ayudar sin anunciarlo. De hacerte cargo. Resulta que uno aprende mucho simplemente mirando.",
        "Y en los días difíciles todavía aparecés. | A veces en una pregunta muy simple: “¿qué haría papá?”. No siempre hacemos exactamente eso —tampoco exageremos—, pero más de una vez nos ordena la cabeza."
      ],
      closedLabel:"Tocá para descubrir",
      outroTitle:"Supongo que una parte de crecer es esta:",
      outroBody:"Pasar años queriendo hacer todo a nuestra manera y descubrir que, sin darnos cuenta, llevamos un pedacito de la tuya. Y nos gusta que sea así.",
      cta:"Ahora queremos que nos escuches →"
    },
    voices:{
      kicker:"Hay cosas que por escrito quedan demasiado prolijas",
      title:["Así que mejor te las decimos","como salen."],
      intro:"Sin discurso. Sin frase perfecta. Como cuando hablamos de verdad.",
      cardIntros:["Pa, esta te la debía.","Esto me da un poco de risa admitirlo.","Esta la queríamos decir entre todos."],
      playLabel:"Tocá para escuchar",
      playingLabel:"Escuchando…",
      outroTitle:"No hace falta que respondas nada ahora.",
      outroBody:"Con que sepas que lo vimos —aunque hayamos tardado bastante en demostrarlo— alcanza.",
      cta:"Seguir. Falta una cosa →"
    },
    letter:{
      kicker:"Ahora sí. Sin vueltas.",
      title:["Pa, hay algo que queremos","dejarte por escrito."],
      sealHint:"Abrila cuando quieras",
      cta:"Guardar esto →"
    },
    lookback:{
      kicker:"Hay algo que cambia cuando uno crece",
      closedTitle:"Un día dejás de mirar a tu papá sólo como “papá”.",
      openTitle:"Y empezás a ver al tipo que también estaba aprendiendo, preocupándose, cansándose, equivocándose y volviendo a intentar. Entender eso no te hace más chico. Al contrario: te hace todavía más grande en nuestra historia.",
      openLabel:"Mirarte de nuevo",
      cta:"Y ahí entendimos esto →"
    },
    finale:{
      kicker:"Pa, por si no lo decimos seguido",
      lead:"Gracias por estar. Por insistir. Por hacernos reír. Por hacernos renegar también. Por todas esas cosas que en su momento parecían normales y hoy sabemos que eran amor.",
      reactions:["Me llegó","Me hicieron reír","Me emocionó","Los quiero"],
      restartLabel:"Volver al comienzo",
      createdWith:"hecho con amor en Te Hice Esto"
    }
  },
  amistad:{
    intro:{kicker:"Archivo confidencial · acceso sólo para {recipient}",cta:"Abrir expediente",footnote:"Si aparece una foto comprometedora, negamos todo"},
    quiz:{kicker:"Primero comprobemos que sos vos",cta:"Ok, demasiada evidencia →"},
    memories:{kicker:"Material que jamás debería llegar a un grupo familiar",title:["Malas decisiones.","Excelentes recuerdos."],cta:"Siguiente prueba →"},
    light:{kicker:"Hay una historia que no conviene iluminar demasiado",title:"Bueno. Sólo un poco.",revealedLabel:"prueba encontrada ✦",cta:"Cerrar evidencia →"},
    balloons:{kicker:"Declaraciones oficialmente vinculantes",title:["Reventá tres.","Después no hay reclamos."],popLabel:"ABRIR",remainingOne:"Queda 1",remainingMany:"Quedan {count}",cta:"Acepto todo →"},
    scratch:{kicker:"Cupón con validez legal dudosa",title:["Pero igual","lo vas a usar."],coverTitle:"RASPÁ, COBARDE",coverHint:"hay plan abajo",fallbackLabel:"hacer trampa",cta:"Plan cerrado →"},
    hold:{kicker:"Momento incómodamente sincero",title:["Sí, ahora viene","la parte sentimental."],instruction:"aguantá un segundo",cta:"Bueno, basta →"},
    letter:{kicker:"No uses esto en mi contra",title:["Me voy a poner seria","durante treinta segundos."],sealHint:"Abrir bajo tu responsabilidad",cta:"Prometo no llorar →"},
    finale:{kicker:"Fin del archivo",lead:"Nos vemos afuera de Internet para seguir tomando decisiones cuestionables.",restartLabel:"Reabrir expediente"},
  },
};

function isObject(value:unknown): value is Record<string,unknown>{
  return Boolean(value) && typeof value==="object" && !Array.isArray(value);
}

function mergeDeep<T>(base:T,...patches:DeepPartial<T>[]):T{
  let output:unknown=Array.isArray(base)?[...base]:isObject(base)?{...base}:base;
  for(const patch of patches){
    if(!isObject(patch)) continue;
    const target=isObject(output)?output:{};
    for(const [key,value] of Object.entries(patch)){
      if(value===undefined) continue;
      const current=target[key];
      target[key]=isObject(value)&&isObject(current)
        ? mergeDeep(current as never,value as never)
        : Array.isArray(value)?[...value]:value;
    }
    output=target;
  }
  return output as T;
}

function contentFromExperience(experience:Experience):DeepPartial<ExperienceCopy>{
  const demo=experience.demo;
  const moment=premiumMoments[experience.slug]||premiumMoments.pareja;
  return {
    intro:{lead:experience.opening},
    memories:{items:demo.memories||[]},
    stars:{items:demo.stars||[]},
    scratch:{
      eyebrow:demo.scratchEyebrow||BASE_COPY.scratch.eyebrow,
      reward:demo.scratchReward||BASE_COPY.scratch.reward,
      note:demo.scratchNote||BASE_COPY.scratch.note,
    },
    letter:{body:demo.letter||BASE_COPY.letter.body},
    balloons:{items:demo.balloons||[]},
    timeline:{entries:demo.timeline||[]},
    voices:{entries:demo.voices||[]},
    quiz:demo.quiz?{
      question:demo.quiz.question,answers:demo.quiz.answers,correctIndex:demo.quiz.correctIndex,
      after:demo.quiz.after,
    }:undefined,
    capsule:demo.capsule?{
      year:demo.capsule.year,closed:demo.capsule.closed,open:demo.capsule.open,
    }:undefined,
    light:{
      kicker:moment.light.kicker,title:moment.light.title,secret:moment.light.secret,hint:moment.light.hint,
    },
    hold:{
      kicker:moment.hold.kicker,prompt:moment.hold.prompt,reveal:moment.hold.reveal,symbol:moment.hold.symbol,
    },
    finale:{title:experience.closing},
    proposal:{title:experience.closing},
  };
}

export function getExperienceCopy(experience:Experience,override?:DeepPartial<ExperienceCopy>):ExperienceCopy{
  return mergeDeep(BASE_COPY,contentFromExperience(experience),DEMO_OVERRIDES[experience.slug]||{},override||{});
}
