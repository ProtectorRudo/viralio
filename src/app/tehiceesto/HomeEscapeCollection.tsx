import Link from "next/link";
import {formatTeHiceEstoPrice} from "./pricing";

type Scene="rescue"|"cinema"|"garden";

/** Original, lightweight vector scenes: distinctive cinematic art direction,
 * not screenshots, stock photography or client media. */
export function EscapeScene({scene}:{scene:Scene}){
 if(scene==="rescue")return <svg viewBox="0 0 720 430" aria-hidden="true" focusable="false" className="thh-escape-scene-svg" preserveAspectRatio="xMidYMid slice">
  <defs>
   <linearGradient id="thh-r-wall" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#24303b"/><stop offset=".55" stopColor="#111e28"/><stop offset="1" stopColor="#090f18"/></linearGradient>
   <linearGradient id="thh-r-floor" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4b413a"/><stop offset="1" stopColor="#141a22"/></linearGradient>
   <radialGradient id="thh-r-light"><stop stopColor="#ffe2ad" stopOpacity=".9"/><stop offset=".42" stopColor="#dca56d" stopOpacity=".24"/><stop offset="1" stopColor="#cd9865" stopOpacity="0"/></radialGradient>
   <linearGradient id="thh-r-door" x1="0" y1="0" x2="1" y2=".8"><stop stopColor="#786b5d"/><stop offset=".55" stopColor="#332d2a"/><stop offset="1" stopColor="#171b20"/></linearGradient>
  </defs>
  <rect width="720" height="430" fill="#101722"/>
  <path d="M0 0H720V430H0Z" fill="url(#thh-r-wall)"/>
  <path d="M0 0H720L480 166H244Z" fill="#0a131c"/>
  <path d="M0 0L244 166V310L0 430Z" fill="#1b2731"/>
  <path d="M720 0L480 166V310L720 430Z" fill="#111c27"/>
  <path d="M0 430L244 310H480L720 430Z" fill="url(#thh-r-floor)"/>
  <path d="M0 0L244 166M720 0L480 166M0 430L244 310M720 430L480 310" fill="none" stroke="#8c887d" strokeOpacity=".15" strokeWidth="3"/>
  <path d="M360 0V166M168 430L290 310M552 430L430 310M265 358H454M95 397H625" fill="none" stroke="#dbb391" strokeOpacity=".15" strokeWidth="2"/>
  <path d="M301 143H422V313H301Z" fill="#060b13" stroke="#a0947a" strokeOpacity=".5" strokeWidth="7"/>
  <path d="M317 157H406V309H317Z" fill="url(#thh-r-door)"/>
  <path d="M358 158V310M334 180H390M334 287H390" stroke="#a19480" strokeOpacity=".25" strokeWidth="2"/>
  <circle cx="389" cy="240" r="3" fill="#eac696"/>
  <ellipse cx="361" cy="293" rx="210" ry="169" fill="url(#thh-r-light)" opacity=".85"/>
  <path d="M357 0V108" stroke="#a7a096" strokeWidth="3"/><ellipse cx="357" cy="117" rx="27" ry="8" fill="#e4c49a"/><path d="M331 117Q357 157 383 117" fill="#ab8160" opacity=".92"/><ellipse cx="357" cy="119" rx="18" ry="4" fill="#fff1c9"/>
  <path d="M15 246L183 222V370L15 418Z" fill="#101722" stroke="#b0a5a0" strokeOpacity=".25" strokeWidth="3"/>
  <path d="M19 249L184 223L220 250L66 292Z" fill="#514942"/>
  <path d="M56 272L133 260L167 287L91 300Z" fill="#e8d3b1"/><path d="M82 273L126 266M90 283L148 279" stroke="#7b5348" strokeWidth="2"/>
  <path d="M536 186L654 205V372L536 334Z" fill="#283440" stroke="#b0a4a3" strokeOpacity=".3" strokeWidth="3"/>
  <path d="M548 207L637 224V274L548 257Z" fill="#0a0f19"/><path d="M564 237H622" stroke="#bad0d0" strokeOpacity=".25" strokeWidth="2"/>
  <rect x="568" y="298" width="54" height="24" rx="3" fill="#100f14" stroke="#d0ad77" strokeOpacity=".8"/>
  <text x="576" y="315" fontFamily="monospace" fontSize="14" fill="#d2b18c" letterSpacing="3">••••••</text>
  <rect width="720" height="430" fill="url(#thh-r-light)" opacity=".12"/>
  <path d="M0 65H194M524 65H720" stroke="#f8ebd4" strokeOpacity=".06" strokeWidth="2"/>
 </svg>;
 if(scene==="cinema")return <svg viewBox="0 0 720 430" aria-hidden="true" focusable="false" className="thh-escape-scene-svg" preserveAspectRatio="xMidYMid slice">
  <defs>
   <linearGradient id="thh-c-night" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#2f233e"/><stop offset=".5" stopColor="#151322"/><stop offset="1" stopColor="#070b17"/></linearGradient>
   <radialGradient id="thh-c-screen"><stop stopColor="#e0d1cb" stopOpacity=".85"/><stop offset=".45" stopColor="#c5acb0" stopOpacity=".22"/><stop offset="1" stopColor="#8776ae" stopOpacity="0"/></radialGradient>
   <linearGradient id="thh-c-curtain"><stop stopColor="#380f22"/><stop offset=".5" stopColor="#783445"/><stop offset="1" stopColor="#220e24"/></linearGradient>
   <linearGradient id="thh-c-stage" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4e3146"/><stop offset="1" stopColor="#070916"/></linearGradient>
  </defs>
  <rect width="720" height="430" fill="url(#thh-c-night)"/>
  <ellipse cx="358" cy="206" rx="250" ry="190" fill="url(#thh-c-screen)"/>
  <path d="M100 46H620L580 290H140Z" fill="#211724" stroke="#655365" strokeWidth="14"/>
  <path d="M147 65H573V276H147Z" fill="#e1c7bb" opacity=".65"/>
  <path d="M151 67H571V272H151Z" fill="#6b596d"/>
  <path d="M173 84H549V256H173Z" fill="#d0b6b0" opacity=".24"/>
  <path d="M173 84H549V256H173Z" fill="#191a29" opacity=".65"/>
  <path d="M174 86L554 258V86Z" fill="#f6e1ce" opacity=".1"/>
  <circle cx="357" cy="174" r="67" fill="url(#thh-c-screen)" opacity=".52"/>
  <text x="360" y="147" fontFamily="Georgia,serif" fontSize="15" letterSpacing="8" fill="#ead3cb" textAnchor="middle">LA SALA</text>
  <text x="360" y="190" fontFamily="Georgia,serif" fontSize="42" fill="#fff0e4" textAnchor="middle">03:17</text>
  <path d="M0 0H128C125 100 142 208 115 319L0 430Z" fill="url(#thh-c-curtain)"/>
  <path d="M720 0H592C595 100 578 208 605 319L720 430Z" fill="url(#thh-c-curtain)"/>
  {Array.from({length:5},(_,i)=><path key={i} d={`M${22+i*21} -10Q${i*18} 175 ${25+i*17} 353`} stroke="#d99491" strokeOpacity=".16" strokeWidth="13" fill="none"/>)}
  {Array.from({length:5},(_,i)=><path key={i} d={`M${699-i*21} -10Q${720-i*18} 175 ${695-i*17} 353`} stroke="#d99491" strokeOpacity=".16" strokeWidth="13" fill="none"/>)}
  <path d="M0 357Q360 270 720 357V430H0Z" fill="url(#thh-c-stage)"/>
  <path d="M0 398Q360 318 720 398" fill="none" stroke="#99839a" strokeOpacity=".3" strokeWidth="3"/>
  {Array.from({length:8},(_,i)=>{
    const x=13+i*98;return <g key={i}><rect x={x} y="352" width="69" height="82" rx="19" fill="#1c1120" stroke="#9b6375" strokeOpacity=".45" strokeWidth="3"/><rect x={x+7} y="367" width="55" height="55" rx="14" fill="#382334"/><path d={`M${x+6} 393H${x+63}`} stroke="#ab6b7e" strokeOpacity=".3"/></g>
  })}
  <path d="M0 350L272 288L310 288L225 430H0Z" fill="#1b1426" opacity=".65"/>
  <path d="M720 350L448 288L410 288L495 430H720Z" fill="#1b1426" opacity=".65"/>
  <ellipse cx="360" cy="295" rx="156" ry="24" fill="url(#thh-c-screen)" opacity=".18"/>
 </svg>;
 return <svg viewBox="0 0 720 430" aria-hidden="true" focusable="false" className="thh-escape-scene-svg" preserveAspectRatio="xMidYMid slice">
  <defs>
   <linearGradient id="thh-g-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#452b4a"/><stop offset=".49" stopColor="#ad797c"/><stop offset="1" stopColor="#d6ad95"/></linearGradient>
   <radialGradient id="thh-g-sun"><stop stopColor="#ffefc8" stopOpacity=".96"/><stop offset=".34" stopColor="#e9b79b" stopOpacity=".49"/><stop offset="1" stopColor="#cf859f" stopOpacity="0"/></radialGradient>
   <linearGradient id="thh-g-ground" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#58404a"/><stop offset="1" stopColor="#191b2c"/></linearGradient>
   <linearGradient id="thh-g-paper" x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#fff7ea"/><stop offset="1" stopColor="#c9ad9f"/></linearGradient>
  </defs>
  <rect width="720" height="430" fill="url(#thh-g-sky)"/>
  <circle cx="358" cy="193" r="190" fill="url(#thh-g-sun)"/>
  <path d="M0 340L720 340V430H0Z" fill="url(#thh-g-ground)"/>
  <path d="M81 350V163C81 5 639 5 639 163V350" fill="none" stroke="#3d303c" strokeWidth="18"/>
  <path d="M130 350V165C130 72 590 72 590 165V350" fill="none" stroke="#423442" strokeWidth="11"/>
  <path d="M210 350V158C210 100 510 100 510 158V350" fill="none" stroke="#58404b" strokeOpacity=".9" strokeWidth="7"/>
  <path d="M360 64V350M80 166H640M102 235H616M120 300H599M0 357H720" fill="none" stroke="#4d3748" strokeWidth="7"/>
  <path d="M80 165L359 65L639 165" fill="none" stroke="#352d40" strokeWidth="5" opacity=".63"/>
  <path d="M0 158L360 64L720 158" fill="none" stroke="#edc0b0" strokeOpacity=".24" strokeWidth="3"/>
  <path d="M0 160L82 182V350H0ZM720 160L639 182V350H720Z" fill="#3f3040" opacity=".6"/>
  <path d="M0 358Q62 306 100 341T200 331Q251 316 288 349T390 332Q451 303 496 344T602 326Q668 313 720 347V430H0Z" fill="#27303a" opacity=".8"/>
  {Array.from({length:6},(_,i)=>{
    const x=30+i*130;
    return <g key={i}><path d={`M${x} 435Q${x-17} 366 ${x+25} 301`} fill="none" stroke="#1d3033" strokeWidth="8"/><path d={`M${x+7} 382q-43 -22 -28 -45q42 -7 45 35M${x+13} 356q22 -42 48 -31q0 25 -43 39`} fill="#25383b"/><circle cx={x+26} cy="293" r="16" fill="#a66e7d"/><circle cx={x+24} cy="286" r="8" fill="#d2a3a0" opacity=".6"/></g>
  })}
  <path d="M285 206L432 206L432 295L285 295Z" fill="#e9cfbd" stroke="#ab877d" strokeWidth="5" transform="rotate(-4 358 251)"/>
  <path d="M291 214L359 265L426 214" fill="none" stroke="#af8e83" strokeWidth="3" transform="rotate(-4 358 251)"/>
  <circle cx="355" cy="264" r="17" fill="#b6636a" stroke="#ecd3b5" strokeWidth="4"/>
  <path d="M350 266q5 -8 10 0q-5 7 -10 0" fill="#f8c5b5"/>
  <ellipse cx="356" cy="305" rx="119" ry="29" fill="#130f1b" opacity=".21"/>
  <path d="M338 350L335 428M380 350L385 428" stroke="#e2bca9" strokeOpacity=".35" strokeWidth="4"/>
 </svg>;
}

const rooms=[
 {slug:"caso-m",number:"01",genre:"RESCATE · SUSPENSO",title:"CASO M",scene:"rescue" as Scene,
  signature:"Una desaparición. Una cuenta regresiva.",
  description:"Explorá la escena, descifrá seis cifras y abrí un cajón que esconde la verdadera sorpresa.",
  motif:"EL EXPEDIENTE",duration:"3 MIN + DESAFÍO FINAL"},
 {slug:"ultima-funcion",number:"02",genre:"TERROR · CINE",title:"La Última Función",scene:"cinema" as Scene,
  signature:"La función terminó. Alguien sigue ahí.",
  description:"Butacas, oscuridad y acertijos en un cine abandonado. El desenlace es un mensaje sólo para esa persona.",
  motif:"EL ÚLTIMO BOLETO",duration:"8 MIN DE INTRIGA"},
 {slug:"ultima-campanada",number:"03",genre:"ROMANCE · MISTERIO",title:"La Última Campanada",scene:"garden" as Scene,
  signature:"Antes de que se apague el jardín.",
  description:"Un jardín que pierde su luz, un reloj y una carta escondida. Un misterio que termina en emoción.",
  motif:"LA CARTA SELLADA",duration:"9 MIN DE AVENTURA"},
];

export default function HomeEscapeCollection({prefix=""}:{prefix?:string}){
 const url=(path:string)=>prefix+path;
 return <section className="thh-escape-collection thh-escape-v3" id="escapes" aria-labelledby="thh-escape-title">
  <div className="thh-escape-shell">
   <header className="thh-escape-heading">
    <div className="thh-escape-heading-main">
     <span className="thh-escape-eyebrow"><i aria-hidden="true"/> NUEVA COLECCIÓN · ESCAPE ROOMS PARA REGALAR</span>
     <h2 id="thh-escape-title">No le cuentes la sorpresa.<em>Que la descubra.</em></h2>
    </div>
    <div className="thh-escape-heading-side">
     <p>Entra a un mundo de pistas, tensión y secretos. Cuando resuelve el misterio, encuentra <strong>la carta o invitación que preparaste para esa persona.</strong></p>
     <span>3 aventuras originales · Jugables desde el celular</span>
    </div>
   </header>

   <div className="thh-escape-how" aria-label="Cómo funcionan los escape rooms para regalar">
    <span><b>01</b> Elegís una aventura</span>
    <i aria-hidden="true"/>
    <span><b>02</b> La personalizamos para vos</span>
    <i aria-hidden="true"/>
    <span><b>03</b> Descubre el mensaje al escapar</span>
   </div>

   <div className="thh-escape-cards">
    {rooms.map(room=><article key={room.slug} className={`thh-escape-card thh-escape-card--${room.scene}`}>
      <Link className="thh-escape-art" href={url("/escapes/"+room.slug)} aria-label={"Jugar la demo de "+room.title}>
       <EscapeScene scene={room.scene}/>
       <span className="thh-escape-art-tint" aria-hidden="true"/>
       <span className="thh-escape-art-top"><b>{room.number} / 03</b><span>{room.motif}</span></span>
       <span className="thh-escape-art-bottom"><small>DEMO INTERACTIVA</small><span className="thh-escape-play" aria-hidden="true">▶</span></span>
      </Link>
      <div className="thh-escape-card-body">
       <span className="thh-escape-card-genre">{room.genre}</span>
       <h3><Link href={url("/escapes/"+room.slug)}>{room.title}</Link></h3>
       <strong className="thh-escape-card-signature">{room.signature}</strong>
       <p>{room.description}</p>
       <div className="thh-escape-card-meta"><span>◷ {room.duration}</span><span>{formatTeHiceEstoPrice()}</span></div>
       <div className="thh-escape-card-actions">
        <Link className="thh-escape-demo" href={url("/escapes/"+room.slug)}>Probar demo <span aria-hidden="true">↗</span></Link>
        <Link className="thh-escape-buy" href={url("/escapes/"+room.slug+"/comprar")} aria-label={"Regalar "+room.title}>Regalar <span aria-hidden="true">→</span></Link>
       </div>
      </div>
    </article>)}
   </div>
   <div className="thh-escape-bottom">
    <p><span aria-hidden="true">✧</span> Cada aventura conserva su diseño y sus desafíos. Nuestro equipo personaliza los contenidos de la sorpresa final; en CASO M, también el código y sus pistas.</p>
    <Link className="thh-escape-more" href={url("/escapes")}>Conocer la colección completa <span aria-hidden="true">↗</span></Link>
   </div>
  </div>
 </section>;
}
