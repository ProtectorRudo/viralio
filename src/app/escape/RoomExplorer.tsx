"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./RoomExplorer.module.css";

type Kind = "drawer" | "slide" | "rotate" | "pull" | "look" | "collect" | "lock";
type ObjectDef = {
  id:string; title:string; zone:number; x:number; y:number; icon:string; kind:Kind;
  description:string; detail:string; after:string; threshold?:number; gives?:string; requires?:string;
};
export type ExplorationState = {collected:string[]; mechanisms:Record<string,number>; discovered:string[]};
export const EMPTY_EXPLORATION: ExplorationState = {collected:[],mechanisms:{},discovered:[]};

const ROOM_OBJECTS: ObjectDef[][] = [
  [
    {id:"foyer-drawer",title:"Cajón de la consola",zone:0,x:30,y:65,icon:"▤",kind:"drawer",description:"Un mueble de nogal junto a la puerta. El cajón está trabado por la humedad.",detail:"Arrastrá el cajón para abrirlo: algo metálico tintinea al fondo.",after:"Entre facturas viejas aparece una llave de bronce marcada con una E.",threshold:72,gives:"Llave de bronce"},
    {id:"foyer-coat",title:"Abrigo de viaje",zone:0,x:71,y:45,icon:"♧",kind:"look",description:"El abrigo sigue mojado, aunque nadie ha entrado en años.",detail:"Un boleto de tren fechado en 1918; alguien llegó mucho después que Elías.",after:"Boleto de tren · 1918"},
    {id:"foyer-bell",title:"Campanilla de servicio",zone:0,x:76,y:70,icon:"♢",kind:"pull",description:"Una campanilla oxidada. El cordel lleva décadas inmóvil.",detail:"Tirá del cordel. Su sonido viaja mucho más lejos de lo que debería.",after:"Se oye un golpe detrás de la escalera. Hay habitaciones que responden."},
    {id:"foyer-umbrella",title:"Paragüero",zone:0,x:23,y:80,icon:"⌁",kind:"look",description:"Tres paraguas, uno sin empuñadura.",detail:"Un paraguas lleva las iniciales M.V. No tiene importancia para la cerradura.",after:"Iniciales grabadas: M.V."},
    {id:"foyer-carpet",title:"Alfombra del umbral",zone:1,x:35,y:82,icon:"≋",kind:"slide",description:"El tejido forma ondas extrañas. Parece desplazado a propósito.",detail:"Corré la alfombra hacia un lado para revisar las baldosas.",after:"En el suelo: tres líneas paralelas y la palabra EDADES.",threshold:66},
    {id:"foyer-mirror",title:"Espejo del recibidor",zone:1,x:27,y:32,icon:"◈",kind:"rotate",description:"Un espejo móvil inclinado sobre un soporte de hierro.",detail:"Giralo lentamente para examinar el reverso.",after:"Al dorso hay una inscripción: «LOS AÑOS NO OLVIDAN».",threshold:74},
    {id:"foyer-ledger",title:"Libro de visitas",zone:1,x:76,y:69,icon:"✎",kind:"look",description:"Un registro de entradas cuyas últimas páginas están arrancadas.",detail:"Nora firmó por última vez después de que el retrato de su padre fuera colgado.",after:"Último registro: Nora · 1918"},
    {id:"foyer-lamp",title:"Farol antiguo",zone:1,x:68,y:28,icon:"☼",kind:"rotate",description:"El farol no enciende; el selector todavía se mueve.",detail:"Giralo. La sombra dibuja números en el techo.",after:"Las sombras parecen marcar el 7, pero el reflejo desaparece al instante.",threshold:80},
    {id:"foyer-vase",title:"Florero astillado",zone:2,x:25,y:63,icon:"✿",kind:"slide",description:"El florero oculta una grieta en la moldura.",detail:"Deslizá el florero para ver qué hay debajo.",after:"Pétalos secos de la misma flor que sostiene Mara.",threshold:70},
    {id:"foyer-lockbox",title:"Caja de caoba",zone:2,x:72,y:59,icon:"⚿",kind:"lock",requires:"Llave de bronce",description:"Una cajita que no se abre tirando de la tapa.",detail:"Necesitás una llave. Seleccionala en tu inventario e insertala.",after:"En el interior hay una placa con tres huecos: 4 · 2 · 7.",gives:"Placa familiar"},
    {id:"foyer-stairs",title:"Escalera principal",zone:2,x:44,y:38,icon:"↗",kind:"look",description:"La madera cruje con el peso de alguien que no ves.",detail:"Los escalones tienen arañazos a la altura de una niña.",after:"Marcas pequeñas, como si arrastraran un juguete."},
    {id:"foyer-photograph",title:"Fotografía volteada",zone:2,x:80,y:28,icon:"▧",kind:"look",description:"Una fotografía escondida detrás de una moldura.",detail:"La casa de la imagen todavía estaba en construcción.",after:"La obra comenzó antes de que naciera Nora."},
  ],
  [
    {id:"study-shelf",title:"Estante desplazable",zone:0,x:28,y:45,icon:"▥",kind:"slide",description:"Un estante tiene marcas de arrastre sobre el parquet.",detail:"Empujalo: detrás hay una anotación escrita en la pared.",after:"Tres dibujos: luna, cerradura y rosa, pero no indican el orden.",threshold:76},
    {id:"study-ink",title:"Tintero de vidrio",zone:0,x:72,y:71,icon:"◉",kind:"collect",description:"La tinta se ha secado en el fondo del cristal.",detail:"Podés recoger el tintero y estudiarlo desde el inventario.",after:"El vidrio muestra restos de una tinta violácea.",gives:"Tintero violeta"},
    {id:"study-lamp",title:"Lámpara verde",zone:0,x:66,y:32,icon:"☼",kind:"rotate",description:"El cuello articulado de la lámpara está suelto.",detail:"Giralo para orientar la luz sobre el escritorio.",after:"La luz revela el relieve de una rosa sobre el papel.",threshold:67},
    {id:"study-portrait",title:"Retrato del fundador",zone:0,x:25,y:25,icon:"▧",kind:"look",description:"El retrato es más reciente de lo que parece.",detail:"Elías sostuvo la misma llave que aparece dibujada en el papel.",after:"Sobre el marco: «Nadie gobierna la memoria»."},
    {id:"study-drawer",title:"Cajón del escritorio",zone:1,x:43,y:77,icon:"▤",kind:"drawer",description:"La madera está hinchada. Hay que tirar con firmeza.",detail:"Corré el cajón: debajo de un montón de facturas hay algo circular.",after:"Un disco de latón grabado con tres ramas.",threshold:72,gives:"Disco de latón"},
    {id:"study-globe",title:"Globo terráqueo",zone:1,x:68,y:38,icon:"◯",kind:"rotate",description:"Un globo antiguo con continentes casi borrados.",detail:"Hacelo girar. En el polo sur hay una marca pintada.",after:"La marca no es un lugar. Tiene forma de luna creciente.",threshold:80},
    {id:"study-lettercase",title:"Archivador con cerradura",zone:1,x:75,y:65,icon:"⚿",kind:"lock",requires:"Disco de latón",description:"Una compuerta circular sin agujero de llave.",detail:"Necesitás una pieza que encaje con sus tres ranuras.",after:"En el archivo: «Solo la rosa florece después del camino».",gives:"Documento sellado"},
    {id:"study-quill",title:"Pluma de escritura",zone:1,x:24,y:67,icon:"✎",kind:"look",description:"La pluma conserva una gota de tinta fresca.",detail:"Alguien estuvo escribiendo hace apenas unos minutos.",after:"En el mantel: «No todos los libros hablan»."},
    {id:"study-curtain",title:"Cortina gruesa",zone:2,x:36,y:34,icon:"≈",kind:"slide",description:"Una cortina de terciopelo cubre la mitad de una ventana.",detail:"Corré la tela para descubrir el vidrio.",after:"Hay un dibujo grabado: una llave entre dos estrellas.",threshold:69},
    {id:"study-hourglass",title:"Reloj de arena",zone:2,x:72,y:42,icon:"⌛",kind:"rotate",description:"La arena forma una columna imposible que no cae.",detail:"Giralo por completo y observá cómo se mueve el polvo.",after:"La arena tarda un segundo en empezar a caer.",threshold:78},
    {id:"study-phonograph",title:"Gramófono roto",zone:2,x:65,y:76,icon:"♫",kind:"pull",description:"El brazo está desenganchado y no hay discos cerca.",detail:"Levantá el brazo con cuidado.",after:"Una voz breve susurra «el camino» y vuelve el silencio."},
    {id:"study-journal",title:"Diario cerrado",zone:2,x:19,y:71,icon:"▣",kind:"look",description:"Las páginas llevan el sello de la familia.",detail:"Elías dejó la instrucción de apagar toda llama al abandonar el despacho.",after:"Nota: «El miedo no revela el orden»."},
  ],
  [
    {id:"eva-toychest",title:"Baúl de juguetes",zone:0,x:33,y:70,icon:"▤",kind:"drawer",description:"El baúl tiene una pestaña que podés correr.",detail:"Abrilo despacio: los juguetes siguen perfectamente ordenados.",after:"Una pequeña llave de cuerda descansa bajo un caballo de madera.",threshold:75,gives:"Llave de cuerda"},
    {id:"eva-horse",title:"Caballo de madera",zone:0,x:78,y:66,icon:"♘",kind:"pull",description:"Las ruedas hacen sonar una campanita al moverse.",detail:"Tirá del caballito. Se oye una nota musical.",after:"La campana suena como SOL, la primera nota de la canción."},
    {id:"eva-book",title:"Cuento de estrellas",zone:0,x:35,y:33,icon:"✧",kind:"look",description:"Un libro ilustrado abierto por la última página.",detail:"La heroína promete volver tres veces antes de despedirse.",after:"Una frase subrayada: «La última nota es la primera»."},
    {id:"eva-window",title:"Cortina de encaje",zone:0,x:75,y:33,icon:"≈",kind:"slide",description:"Una luna pálida ilumina el alféizar.",detail:"Descorré la cortina. Alguien ha dibujado sobre el vidrio.",after:"Cuatro puntos, el último igual que el primero.",threshold:63},
    {id:"eva-drawer",title:"Mesita de noche",zone:1,x:23,y:73,icon:"▤",kind:"drawer",description:"La cajonera de Eva tiene un tirador de porcelana.",detail:"Abrí el cajón. Dentro hay un lazo azul, todavía anudado.",after:"El lazo desprende un perfume que no debería sobrevivir tantos años.",threshold:70,gives:"Lazo azul"},
    {id:"eva-doll-back",title:"Espalda de la muñeca",zone:1,x:72,y:54,icon:"◌",kind:"rotate",description:"El vestido tiene una costura extraña.",detail:"Girá la muñeca: la etiqueta está cosida del revés.",after:"La etiqueta dice: «SOL / MI / LA / SOL».",threshold:82},
    {id:"eva-drawing",title:"Dibujo bajo la cama",zone:1,x:44,y:82,icon:"✎",kind:"look",description:"Una casa dibujada con lápices de colores.",detail:"En el dibujo hay cuatro ventanas; dos están iluminadas.",after:"La puerta del dibujo se abre hacia adentro."},
    {id:"eva-music",title:"Mecanismo de melodía",zone:1,x:66,y:31,icon:"♫",kind:"pull",description:"Algunas piezas de la caja musical están gastadas.",detail:"Tirá de la manivela. Oís la primera de cuatro notas.",after:"La melodía comienza en SOL y termina en el mismo tono."},
    {id:"eva-wardrobe",title:"Armario de la infancia",zone:2,x:36,y:47,icon:"⚿",kind:"lock",requires:"Llave de cuerda",description:"Una caja rectangular sobresale entre los vestidos.",detail:"La cerradura acepta una llave demasiado pequeña para una puerta.",after:"Dentro hay un medallón plateado con las iniciales E.M.",gives:"Medallón de plata"},
    {id:"eva-bedcover",title:"Colcha bordada",zone:2,x:71,y:72,icon:"≋",kind:"slide",description:"El bordado forma un mapa incompleto de la casa.",detail:"Corré la manta: debajo aparece una foto de la familia.",after:"Una foto intacta: Eva sostiene una caja musical.",threshold:74},
    {id:"eva-lullaby",title:"Partitura infantil",zone:2,x:72,y:36,icon:"♬",kind:"look",description:"Los pentagramas están pintados a mano.",detail:"La primera nota está marcada con una estrella.",after:"Un apunte: «Sol se marcha. Sol regresa»."},
    {id:"eva-clock",title:"Reloj de juguete",zone:2,x:20,y:65,icon:"◷",kind:"rotate",description:"Sus agujas de plástico se mueven demasiado fácilmente.",detail:"Hacé girar la aguja para descubrir un dibujo oculto.",after:"Detrás de la aguja hay una puerta con el número 13.",threshold:72},
  ],
  [
    {id:"motor-toolbox",title:"Caja de herramientas",zone:0,x:26,y:67,icon:"▤",kind:"drawer",description:"La caja metálica está parcialmente soldada por el óxido.",detail:"Deslizá su tapa. Quedó una herramienta abandonada dentro.",after:"Encontraste una llave inglesa aún utilizable.",threshold:72,gives:"Llave inglesa"},
    {id:"motor-pressure",title:"Manómetro",zone:0,x:67,y:32,icon:"◷",kind:"rotate",description:"El indicador está atascado en la zona de peligro.",detail:"Giralo con cuidado y escuchá la vibración del tubo.",after:"El manómetro se detiene en el 7, pero esa no es la combinación.",threshold:78},
    {id:"motor-coal",title:"Montículo de carbón",zone:0,x:72,y:79,icon:"♢",kind:"look",description:"El carbón está frío. No alimenta la caldera.",detail:"Una pieza tiene la forma de un corazón, pero es solo una piedra.",after:"Las máquinas quedaron apagadas de golpe."},
    {id:"motor-pipe",title:"Tubería hueca",zone:0,x:23,y:30,icon:"⌁",kind:"pull",description:"Al golpearla, la tubería responde con un eco.",detail:"Tirá de la abrazadera floja.",after:"Un golpe doble contesta al otro lado del muro."},
    {id:"motor-valve",title:"Válvula de bronce",zone:1,x:34,y:41,icon:"⊗",kind:"rotate",description:"La válvula controla un conducto secundario.",detail:"Giralo hasta liberar la presión acumulada.",after:"Un silbido sale por las juntas; el conducto vuelve a respirar.",threshold:70},
    {id:"motor-grate",title:"Rejilla de mantenimiento",zone:1,x:75,y:67,icon:"⚿",kind:"lock",requires:"Llave inglesa",description:"La rejilla está sujeta por una tuerca hexagonal.",detail:"Seleccioná la llave inglesa para aflojar los tornillos.",after:"Detrás de la rejilla hay un fusible de cobre de repuesto.",gives:"Fusible de cobre"},
    {id:"motor-wires",title:"Cables numerados",zone:1,x:43,y:70,icon:"≋",kind:"look",description:"Cuatro pares de cables van hacia el panel de fusibles.",detail:"Los terminales están marcados 2, 3, 4 y 5.",after:"Una inscripción dice «DOS CIRCUITOS, SIETE UNIDADES»."},
    {id:"motor-crank",title:"Volante de arranque",zone:1,x:72,y:30,icon:"◯",kind:"rotate",description:"Un volante pesado conectado a una bomba detenida.",detail:"Giralo: la caldera despierta por un instante.",after:"El mecanismo no se mantiene solo. Necesita corriente.",threshold:76},
    {id:"motor-chain",title:"Cadena de seguridad",zone:2,x:30,y:42,icon:"⌁",kind:"pull",description:"Una cadena termina detrás de una pared metálica.",detail:"Tirá con ambas manos hasta escuchar el pestillo.",after:"Se libera una traba mecánica de la puerta auxiliar.",threshold:66},
    {id:"motor-switch",title:"Interruptor de prueba",zone:2,x:72,y:31,icon:"⏚",kind:"rotate",description:"El interruptor no alimenta la salida.",detail:"Giralo para probar las luces del cuarto.",after:"Por un segundo aparece la sombra de alguien junto a la caldera.",threshold:70},
    {id:"motor-ledger",title:"Parte de mantenimiento",zone:2,x:27,y:76,icon:"▣",kind:"look",description:"El reporte tiene marcas de manos aceitosas.",detail:"La última intervención fue realizada sin autorización.",after:"Firmado: E. V. · 03:13"},
    {id:"motor-door",title:"Compuerta de inspección",zone:2,x:76,y:67,icon:"▥",kind:"slide",description:"Una puerta corrediza se atasca al intentar abrirla.",detail:"Desplazá la compuerta para examinar el conducto.",after:"El conducto lleva hacia el corazón de la casa.",threshold:72},
  ],
];

const REGION_NAMES = [
  ["Entrada", "Centro del vestíbulo", "Escalera"],
  ["Biblioteca", "Escritorio", "Ventanal"],
  ["Zona de juegos", "Cama", "Armario"],
  ["Caldera", "Panel central", "Conductos"],
];

const GAUGE_LABELS: Record<Exclude<Kind,"look"|"collect"|"lock">,string> = {
  drawer:"CORRER EL CAJÓN",slide:"DESLIZAR",rotate:"GIRAR EL MECANISMO",pull:"TIRAR",
};

export default function RoomExplorer({
  room, state, onChange, onClose, onSound,
}: {
  room:number;
  state:ExplorationState;
  onChange:(next:ExplorationState)=>void;
  onClose:()=>void;
  onSound:(success:boolean)=>void;
}) {
  const [zone,setZone]=useState(1);
  const [selected,setSelected]=useState<string|null>(null);
  const [held,setHeld]=useState<string|null>(null);
  const dragging=useRef<{id:number;startX:number;startY:number;startValue:number;kind:Kind;objectId:string}|null>(null);
  const objects=ROOM_OBJECTS[room]??ROOM_OBJECTS[0];
  const object=objects.find(item=>item.id===selected);
  const current=objects.filter(item=>item.zone===zone);
  const discovered=new Set(state.discovered??[]);
  const collected=new Set(state.collected??[]);
  const mechanisms=state.mechanisms??{};
  const totalSeen=objects.filter(item=>discovered.has(item.id)).length;

  function inspect(item:ObjectDef) {
    setSelected(item.id);
    const valid=item.kind==="look"||item.kind==="collect";
    if(valid&&!discovered.has(item.id)){
      onChange({...state,discovered:[...(state.discovered??[]),item.id]});
    }
    onSound(false);
  }
  function activate(item:ObjectDef,value:number) {
    const nextMechanisms={...mechanisms,[item.id]:value};
    if(value>=(item.threshold??65) && !discovered.has(item.id)){
      onChange({...state,mechanisms:nextMechanisms,discovered:[...(state.discovered??[]),item.id]});
      onSound(true);
    }else{
      onChange({...state,mechanisms:nextMechanisms});
    }
  }
  function collect(item:ObjectDef) {
    if(!item.gives||collected.has(item.gives))return;
    if(item.kind!=="collect"&&item.kind!=="lock"&&(mechanisms[item.id]??0)<(item.threshold??65))return;
    if(item.requires && !collected.has(item.requires))return;
    onChange({...state,collected:[...(state.collected??[]),item.gives],discovered:[...new Set([...(state.discovered??[]),item.id])]});
    onSound(true);
  }
  function unlock(item:ObjectDef){
    if(!item.requires||!collected.has(item.requires))return;
    if(held!==item.requires){setHeld(item.requires);return;}
    onChange({...state,mechanisms:{...mechanisms,[item.id]:100},discovered:[...new Set([...(state.discovered??[]),item.id])]});
    onSound(true);
  }
  function dragStart(e:ReactPointerEvent<HTMLDivElement>,item:ObjectDef){
    if(item.kind==="look"||item.kind==="collect"||item.kind==="lock")return;
    if(e.pointerType==="mouse"&&e.button!==0)return;
    e.preventDefault();
    dragging.current={id:e.pointerId,startX:e.clientX,startY:e.clientY,startValue:mechanisms[item.id]??0,kind:item.kind,objectId:item.id};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function dragMove(e:ReactPointerEvent<HTMLDivElement>,item:ObjectDef){
    const drag=dragging.current;
    if(!drag||drag.id!==e.pointerId||drag.objectId!==item.id)return;
    e.preventDefault();
    const dist=drag.kind==="drawer"||drag.kind==="pull"?e.clientY-drag.startY:e.clientX-drag.startX;
    const value=Math.max(0,Math.min(100,Math.round(drag.startValue+dist*.75)));
    if(value!==(mechanisms[item.id]??0))activate(item,value);
  }
  function dragEnd(e:ReactPointerEvent<HTMLDivElement>){
    if(dragging.current?.id!==e.pointerId)return;
    dragging.current=null;
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function shift(to:number){dragging.current=null;setZone(Math.min(2,Math.max(0,to)));setSelected(null);onSound(false);}
  const progress=object?(mechanisms[object.id]??0):0;
  const opened=Boolean(object&&(discovered.has(object.id)||progress>=(object.threshold??65)));
  const photoPosition=["12%","50%","87%"][zone];

  return <section className={styles.explorer} aria-label="Recorrer la habitación" data-testid="umbral-explorer" data-room={room}>
    <header className={styles.header}>
      <div><span>EXPLORACIÓN LIBRE · SECTOR {zone+1}/3</span><h2>{REGION_NAMES[room]?.[zone]}</h2></div>
      <button type="button" onClick={onClose} className={styles.exit} aria-label="Salir de exploración">✕ <span>SALIR</span></button>
    </header>
    <div className={styles.panorama} data-testid="umbral-explorer-view" style={{backgroundPosition:photoPosition,backgroundImage:`linear-gradient(90deg,rgba(2,6,9,.58),transparent 36%,rgba(2,5,8,.46)),image-set(url("/escape/images/room-${room}.webp") 1x,url("/escape/images/retina/room-${room}.webp") 2x)`}}>
      <div className={styles.panoramaTitle}>ZONA {zone+1} <span>· INVESTIGÁ, NO ADIVINES</span></div>
      {current.map((item,index)=><button
        type="button"
        key={item.id}
        className={styles.node+" "+(discovered.has(item.id)? " "+styles.visited:"")}
        style={{left:item.x+"%",top:item.y+"%"}}
        onClick={()=>inspect(item)}
        aria-label={"Examinar "+item.title}
        title={item.title}
      ><span aria-hidden="true">{item.icon}</span><small>{item.title}</small><i>{String(index+1).padStart(2,"0")}</i></button>)}
      <span className={styles.grain} aria-hidden="true"/>
    </div>
    <div className={styles.wayfinding}>
      <button type="button" onClick={()=>shift(zone-1)} disabled={zone===0} aria-label="Moverse hacia la izquierda">← <span>IZQUIERDA</span></button>
      <div className={styles.regionDots}>{REGION_NAMES[room].map((name,i)=><button type="button" key={name} aria-pressed={zone===i} onClick={()=>shift(i)} aria-label={"Ir a "+name}>{String(i+1).padStart(2,"0")}</button>)}</div>
      <button type="button" onClick={()=>shift(zone+1)} disabled={zone===2} aria-label="Moverse hacia la derecha"><span>DERECHA</span> →</button>
    </div>

    {object&&<div className={styles.objectSheet} data-testid="umbral-object-inspection" data-object={object.id}>
      <div className={styles.inspectionHeading}>
        <div><span>OBJETO {String(objects.indexOf(object)+1).padStart(2,"0")} / {String(objects.length).padStart(2,"0")} · {REGION_NAMES[room][zone]}</span><h3>{object.title}</h3></div>
        <button onClick={()=>setSelected(null)} type="button" aria-label="Guardar objeto y volver a la habitación">✕</button>
      </div>
      <div className={styles.objectContent}>
        <div className={styles.physicalScene} data-kind={object.kind}>
          <div className={styles.fixture} role="img" aria-label={"Manipulación táctil de "+object.title} data-draggable={object.kind!=="look"&&object.kind!=="collect"&&object.kind!=="lock"?"true":"false"} onPointerDown={e=>dragStart(e,object)} onPointerMove={e=>dragMove(e,object)} onPointerUp={dragEnd} onPointerCancel={dragEnd} onLostPointerCapture={()=>{dragging.current=null}} style={{transform:object.kind==="rotate"?`rotate(${progress*3.4}deg)`:object.kind==="pull"?`translateY(${progress*.7}px)`:object.kind==="slide"?`translateX(${progress*.65}px)`:object.kind==="drawer"?`translateY(${progress*.65}px)`:undefined}}>
            <span aria-hidden="true">{object.icon}</span>
            <strong>{object.kind==="drawer"?"◈ TIRADOR":object.kind==="rotate"?"⟳ EJE":object.kind==="pull"?"↓ CADENA":object.kind==="lock"?"⚿ CERRADURA":object.kind==="slide"?"⇢ DESLIZAR":"OBJETO"}</strong>
          </div>
          <span className={styles.materialTag}>{opened?"INSPECCIONADO":"SIN EXAMINAR"}</span>
        </div>
        <div className={styles.objectDescription}>
          <p>{object.description}</p>
          {object.kind==="look"||object.kind==="collect"
            ?<blockquote>{object.detail}</blockquote>
            :object.kind==="lock"
              ?<><p>{opened?object.after:object.detail}</p><button className={styles.useItem} type="button" disabled={!object.requires||!collected.has(object.requires)||opened} onClick={()=>unlock(object)}>{opened?"MECANISMO DESBLOQUEADO":!object.requires||!collected.has(object.requires)?"FALTA UNA PIEZA DEL INVENTARIO":held===object.requires?"INSERTAR Y GIRAR "+object.requires.toUpperCase():"SELECCIONAR "+object.requires?.toUpperCase()}</button></>
              :<><p>{opened?object.after:object.detail}</p><p className={styles.dragHint}>↗ ARRASTRÁ LA PIEZA DIRECTAMENTE O USÁ EL CONTROL DE ABAJO.</p><label className={styles.rangeLabel} htmlFor={"umbral-handle-"+object.id}>{GAUGE_LABELS[object.kind]} <b>{progress}%</b></label><input id={"umbral-handle-"+object.id} type="range" min="0" max="100" value={progress} step="1" onChange={e=>activate(object,Number(e.target.value))} aria-label={GAUGE_LABELS[object.kind]+" · "+object.title}/></>}
          {opened&&object.kind!=="lock"&&object.kind!=="collect"&&<blockquote className={styles.revelation}>{object.after}</blockquote>}
          {object.gives&&<button type="button" className={styles.pickUp} disabled={collected.has(object.gives)||(object.kind!=="collect"&&!opened)} onClick={()=>collect(object)}>{collected.has(object.gives)?"✓ EN EL INVENTARIO":"＋ RECOGER "+object.gives.toUpperCase()}</button>}
        </div>
      </div>
    </div>}
    <footer className={styles.inventory} data-testid="umbral-inventory">
      <div className={styles.inventoryHeader}><strong>MOCHILA DE INVESTIGACIÓN</strong><span>{collected.size} OBJETOS · {totalSeen}/{objects.length} EXAMINADOS</span></div>
      <div className={styles.inventoryItems}>{collected.size
        ?[...collected].map(item=><button type="button" aria-pressed={held===item} key={item} onClick={()=>setHeld(held===item?null:item)}><span aria-hidden="true">♢</span>{item}</button>)
        :<p>Vacía. Abrí cajones, mové objetos y buscá herramientas.</p>}</div>
      {held&&<p className={styles.inventoryHint}>TENÉS EN LA MANO: {held.toUpperCase()}. Buscá un mecanismo donde usarlo.</p>}
    </footer>
  </section>;
}
