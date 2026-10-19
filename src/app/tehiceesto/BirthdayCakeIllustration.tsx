"use client";

import { useId } from "react";

/** Vector pastry artwork so every screen receives sharp, animated candles. */
export default function BirthdayCakeIllustration({ blown }: { blown: boolean }) {
  const uid = useId().replace(/[^a-z0-9]/gi, "");
  const g = (name: string) => `${uid}-${name}`;
  const candles = [
    { x: 238, y: 240, scale: .92, delay: ".08s" },
    { x: 320, y: 225, scale: 1, delay: ".2s" },
    { x: 382, y: 220, scale: 1.05, delay: ".0s" },
    { x: 449, y: 228, scale: .97, delay: ".37s" },
    { x: 529, y: 239, scale: .91, delay: ".15s" },
  ];
  const swirls = [
    [173, 268, 1.04],[225, 251, .86],[281, 251, .96],[336, 243, 1],[388, 247, .94],
    [442, 249, 1],[496, 250, .97],[556, 261, .96],[604, 276, .8],
    [201, 290, .88],[259, 279, .8],[316, 278, .85],[376, 281, .9],[438, 278, .85],[511, 279, .84],[569, 294, .85]
  ];
  const gold = [[190,273,9],[256,267,6],[341,261,8],[410,264,7],[482,272,9],[565,278,7],[218,300,4],[298,300,5],[455,308,5],[518,309,4],[370,297,5]];
  return (
    <svg className={`thi-wish-cake-art ${blown ? "is-blown" : ""}`}
      viewBox="0 0 760 580" fill="none" role="img"
      aria-label={blown ? "Torta de cumpleaños con cinco velitas apagadas" : "Torta marfil con detalles dorados y cinco velitas encendidas"}>
      <defs>
        <linearGradient id={g("butter")} x1="0" x2="1" y1=".2" y2=".72">
          <stop offset="0" stopColor="#be9366"/><stop offset=".14" stopColor="#fbebd1"/>
          <stop offset=".36" stopColor="#fff6e5"/><stop offset=".55" stopColor="#eacba4"/>
          <stop offset=".8" stopColor="#d7ab7b"/><stop offset="1" stopColor="#8f5635"/>
        </linearGradient>
        <linearGradient id={g("icing")} x1="0" x2="1">
          <stop offset="0" stopColor="#9d653e"/><stop offset=".13" stopColor="#e4bb8b"/>
          <stop offset=".34" stopColor="#fef1d5"/><stop offset=".64" stopColor="#e9c9a1"/>
          <stop offset=".85" stopColor="#c99161"/><stop offset="1" stopColor="#774a36"/>
        </linearGradient>
        <radialGradient id={g("top")} cx=".45" cy=".25" r=".88">
          <stop offset="0" stopColor="#fff5df"/><stop offset=".5" stopColor="#edd6b5"/>
          <stop offset=".83" stopColor="#bc875f"/><stop offset="1" stopColor="#7d4e38"/>
        </radialGradient>
        <linearGradient id={g("metal")} x1="0" x2="1">
          <stop offset="0" stopColor="#3a2018"/><stop offset=".16" stopColor="#bd8148"/>
          <stop offset=".31" stopColor="#fff0bb"/><stop offset=".47" stopColor="#aa692e"/>
          <stop offset=".7" stopColor="#d6a763"/><stop offset=".9" stopColor="#56321c"/>
          <stop offset="1" stopColor="#3c251d"/>
        </linearGradient>
        <linearGradient id={g("wax")} x1="0" x2="1">
          <stop offset="0" stopColor="#8b5b31"/><stop offset=".17" stopColor="#eec37a"/>
          <stop offset=".42" stopColor="#fff4bf"/><stop offset=".67" stopColor="#c58743"/>
          <stop offset="1" stopColor="#8b502c"/>
        </linearGradient>
        <radialGradient id={g("pearl")} cx=".3" cy=".2" r=".88">
          <stop offset="0" stopColor="#fff9dc"/><stop offset=".24" stopColor="#f8d77a"/>
          <stop offset=".6" stopColor="#c38b32"/><stop offset="1" stopColor="#754217"/>
        </radialGradient>
        <radialGradient id={g("flame")} cx=".48" cy=".73" r=".82">
          <stop offset="0" stopColor="#fffef3"/><stop offset=".29" stopColor="#fff5a0"/>
          <stop offset=".6" stopColor="#ffc35a"/><stop offset=".87" stopColor="#f67b24"/>
          <stop offset="1" stopColor="#b8491b"/>
        </radialGradient>
        <radialGradient id={g("halo")}>
          <stop offset="0" stopColor="#ffcc68" stopOpacity=".52"/>
          <stop offset=".55" stopColor="#f49b41" stopOpacity=".18"/>
          <stop offset="1" stopColor="#ec7e2b" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={g("shade")} x1="0" x2="1">
          <stop offset="0" stopColor="#fff0d9" stopOpacity="0"/>
          <stop offset=".38" stopColor="#fffdf4" stopOpacity=".55"/>
          <stop offset="1" stopColor="#c18e62" stopOpacity="0"/>
        </linearGradient>
        <filter id={g("rough")} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency=".026" numOctaves="3" seed="9" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4"/>
        </filter>
        <filter id={g("warmblur")} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="11"/>
        </filter>
        <filter id={g("shadow")} x="-20%" y="-25%" width="140%" height="150%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#030104" floodOpacity=".69"/>
        </filter>
      </defs>
      {/* warm floor reflections and bronze couture pedestal */}
      <ellipse cx="379" cy="553" rx="280" ry="24" fill="#12080b" opacity=".53" filter={`url(#${g("warmblur")})`}/>
      <path d="M337 444C344 487 343 518 291 540C281 545 285 551 307 552H451C478 552 482 546 469 540C418 520 418 488 421 444Z"
        fill={`url(#${g("metal")})`} stroke="#edc58c" strokeOpacity=".55" strokeWidth="2"/>
      <path d="M355 464C369 496 369 520 341 537" stroke="#ffebb2" strokeOpacity=".32" strokeWidth="8" strokeLinecap="round"/>
      <ellipse cx="379" cy="545" rx="121" ry="19" fill={`url(#${g("metal")})`} stroke="#f3ce9e" strokeOpacity=".7" strokeWidth="2"/>
      <ellipse cx="379" cy="540" rx="115" ry="11" stroke="#ffedb9" strokeOpacity=".43" strokeWidth="1.2"/>
      <g filter={`url(#${g("shadow")})`}>
        <ellipse cx="380" cy="441" rx="298" ry="36" fill="#391e16" opacity=".6"/>
        <path d="M78 427C81 447 202 464 378 468C546 470 676 453 683 430L686 443C683 467 536 487 377 485C209 485 73 465 74 440Z"
          fill={`url(#${g("metal")})`} stroke="#d29b60" strokeWidth="2"/>
        <ellipse cx="380" cy="428" rx="307" ry="41" fill={`url(#${g("metal")})`} stroke="#f3d09b" strokeWidth="3"/>
        <ellipse cx="380" cy="431" rx="275" ry="27" fill="#5d331e" opacity=".63"/>
        {/* layered round buttercream */}
        <path d="M129 277C128 272 148 257 164 259C267 271 485 268 596 260C614 260 633 272 633 282V398C628 428 523 445 379 446C243 444 145 431 129 403Z"
          fill={`url(#${g("icing")})`} stroke="#c59469" strokeWidth="3"/>
        <path d="M143 316C162 306 172 308 186 299M140 353C168 338 174 327 200 324M156 409C219 384 243 346 284 333M228 416C265 379 290 377 332 352M323 431C383 381 405 382 453 351M446 434C478 407 498 401 529 388M549 421C574 395 590 382 607 371"
          stroke="#fff5dc" strokeOpacity=".42" strokeWidth="12" strokeLinecap="round"/>
        <path d="M139 319C166 313 179 300 194 309M145 354C176 341 188 331 202 327M188 408C216 376 269 337 294 337M284 413C310 379 360 359 381 340M423 421C455 393 486 377 521 363M536 419C571 400 584 380 616 376"
          stroke="#8b563a" strokeOpacity=".22" strokeWidth="5" strokeLinecap="round"/>
        <path d="M137 280C152 301 186 291 204 297C219 307 244 298 260 299C305 312 346 299 387 302C423 313 456 298 482 299C516 312 558 302 581 298C607 296 631 295 630 277"
          stroke="#bd864e" strokeWidth="8" strokeLinecap="round"/>
        <path d="M136 281C174 295 198 289 227 291C266 302 315 295 351 296C408 306 449 293 492 295C540 303 580 295 631 282"
          stroke="#f5cc82" strokeWidth="2.7" strokeLinecap="round"/>
        <ellipse cx="380" cy="260" rx="254" ry="52" fill={`url(#${g("top")})`} stroke="#e8bc81" strokeWidth="2.5"/>
        <ellipse cx="380" cy="260" rx="229" ry="39" fill={`url(#${g("butter")})`} opacity=".38"/>
        {/* hand piped buttercream rosettes, three highlights on each */}
        {swirls.map(([x,y,scale],i)=><g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
          <ellipse rx="35" ry="14" cy="7" fill="#a86e45" opacity=".58"/>
          <path d="M-28 7Q-36-12-18-16Q-7-25 3-14Q19-27 26-11Q39-4 26 8Q15 16 2 10Q-18 20-28 7Z"
            fill={`url(#${g("butter")})`} stroke="#f9ebce" strokeOpacity=".6" strokeWidth="1.8"/>
          <path d="M-22 3Q-23-10-8-7Q2-18 13-8Q26-10 23 3Q13 10 5 3Q-6 13-22 3Z"
            fill={`url(#${g("butter")})`} stroke="#fff7df" strokeOpacity=".8" strokeWidth="3"/>
          <path d="M-9 0C-12-7-1-11 6-5C15 0 7 7 0 6C-5 5-3 0 3 0" stroke="#fdf1d3" strokeWidth="4" strokeLinecap="round"/>
        </g>)}
        {gold.map(([x,y,size],i)=><g key={i}>
          <circle cx={x+1} cy={y+2} r={size+2} fill="#80502a" opacity=".6"/>
          <circle cx={x} cy={y} r={size} fill={`url(#${g("pearl")})`} />
          <circle cx={x-size*.3} cy={y-size*.32} r={Math.max(1,size*.19)} fill="#fffae4" opacity=".9"/>
        </g>)}
        {/* organic edible gold leaf, intentionally subtle */}
        {[[204,358],[260,389],[331,341],[372,421],[461,348],[513,404],[575,364]].map(([x,y],i)=>
          <path key={i} d={`M${x} ${y}l7 -5 5 3 -2 7 -8 3 -3 -5Z`}
            fill={i%2?"#c99147":"#f5d090"} stroke="#9a622e" strokeWidth=".65" opacity=".84"/>)}
        <path d="M139 341C153 346 162 348 180 340M210 391C237 380 259 378 290 375M346 410C379 399 397 387 423 385M465 405C487 399 516 390 536 387M568 335C590 340 606 334 618 326"
          stroke="#fff6e5" strokeOpacity=".24" strokeWidth="6" strokeLinecap="round"/>
      </g>
      {/* five gold spiral birthday candles mounted through the cream */}
      {candles.map(({x,y,scale,delay},i)=><g key={i} transform={`translate(${x} ${y}) scale(${scale})`} className="thi-wish-candle" style={{animationDelay:delay}}>
        <ellipse cx="0" cy="4" rx="11" ry="4" fill="#ba8154" opacity=".7"/>
        <rect x="-6.6" y="-91" width="13.2" height="99" rx="3" fill={`url(#${g("wax")})`} stroke="#e4b76d" strokeWidth=".8"/>
        {[-76,-63,-50,-37,-24,-11].map((y,j)=><path key={j} d={`M-6 ${y}q7 5 12 -5`}
          stroke={j%2?"#b06c2e":"#ffedb0"} strokeWidth="3" strokeLinecap="round" opacity=".82"/>)}
        <path d="M-1 -92v-8" stroke="#51372f" strokeWidth="2.2" strokeLinecap="round"/>
        <g className="thi-wish-flame" style={{animationDelay:delay}}>
          <ellipse cx="0" cy="-130" rx="28" ry="44" fill={`url(#${g("halo")})`} filter={`url(#${g("warmblur")})`}/>
          <path d="M0-149C-14-133-11-110 0-107C11-110 14-132 0-149Z" fill={`url(#${g("flame")})`} />
          <path d="M0-135C-6-127-4-114 0-114C4-116 7-126 0-135Z" fill="#fffadd"/>
        </g>
        <g className="thi-wish-smoke">
          <path d="M0-99C-9-116 7-124-1-145S5-172-2-184" stroke="#d4c3b7" strokeWidth="3" strokeLinecap="round" strokeOpacity=".65"/>
          <path d="M4-104C16-125 0-135 11-151" stroke="#f8ebcf" strokeWidth="2" strokeLinecap="round" strokeOpacity=".35"/>
        </g>
      </g>)}
    </svg>
  );
}
