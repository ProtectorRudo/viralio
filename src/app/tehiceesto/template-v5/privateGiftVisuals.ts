/**
 * Photo substitutions for PRIVATE customer gifts only.
 *
 * Public demos keep all of their original editorial/stock photography.
 * Frozen experience engines are untouched: the route supplies a personalized
 * photo list in the same shape as any uploaded photo.
 *
 * All illustrations are locally generated SVG (no strangers, no remote assets).
 */
export type PrivateGiftPhoto<TScene extends string=string>={
  url:string;
  caption?:string;
  fit?:"cover"|"contain";
  position?:"center"|"top"|"bottom"|"left"|"right";
  scene?:TScene;
};

const THEMES={
  pareja:{a:"#251b35",b:"#62405c",c:"#eac5d7",d:"#bf869d",kind:"heart"},
  mama:{a:"#442b40",b:"#9d6278",c:"#f2d2c4",d:"#eab2ab",kind:"flower"},
  papa:{a:"#1d3345",b:"#49697d",c:"#d7e6ed",d:"#95b3c1",kind:"compass"},
  cumpleanos:{a:"#543652",b:"#b16f8a",c:"#fce1cf",d:"#ffc3ae",kind:"stars"},
  hijos:{a:"#21494e",b:"#6a9e98",c:"#e4f3e6",d:"#beded7",kind:"moon"},
  abuelos:{a:"#514459",b:"#9a829c",c:"#f5e6d4",d:"#dbbfcb",kind:"botanical"},
  amistad:{a:"#263d62",b:"#6683a6",c:"#edf1f9",d:"#bbcfed",kind:"constellation"},
  aniversario:{a:"#44233e",b:"#895775",c:"#f7dfdc",d:"#e2afc5",kind:"ribbon"},
  propuesta:{a:"#473746",b:"#9b7985",c:"#fff3e9",d:"#e8c5c9",kind:"ring"},
} as const;
type GiftTheme=typeof THEMES[keyof typeof THEMES];

/** Intentional visual slots in the nine gift journeys. Extra scene photos are never removed. */
export const PRIVATE_PHOTO_SLOTS:Readonly<Record<string,number>>={
  memories:3,
  childhood:1,
  origin:1,
  light:2,
  voices:3,
  sacrifices:4,
  lessons:5,
  presence:4,
  inheritance:5,
};

function motif(kind:GiftTheme["kind"],accent:string){
  const star='<path d="M0 -65 L12 -12 L65 0 L12 12 L0 65 L-12 12 L-65 0 L-12 -12Z"/>';
  switch(kind){
    case "flower": return `<g fill="none" stroke="${accent}" stroke-width="4"><path d="M0 30 C-26 4 -60 -50 -30 -88 C-4 -111 22 -76 0 30Z"/><path d="M0 30 C25 3 58 -47 30 -88 C4 -110 -23 -72 0 30Z"/><path d="M0 30 C-68 20 -114 -21 -96 -54 C-62 -76 -25 -19 0 30Z"/><path d="M0 30 C70 20 115 -18 97 -55 C61 -75 25 -19 0 30Z"/><path d="M0 30 C-40 52 -39 116 0 112 C40 116 40 53 0 30Z"/><circle cx="0" cy="24" r="17" fill="${accent}" opacity=".7"/></g>`;
    case "heart":return `<path d="M0 102 C-31 77 -117 14 -115 -48 C-114 -110 -34 -131 0 -65 C34 -131 114 -110 115 -48 C117 14 31 77 0 102Z" fill="none" stroke="${accent}" stroke-width="5"/><path d="M-55 -25 Q-35 -62 0 -25" fill="none" stroke="${accent}" stroke-width="2" opacity=".45"/>`;
    case "compass":return `<g fill="none" stroke="${accent}" stroke-width="3"><circle r="92"/><circle r="73" opacity=".5"/><path d="M0 -132 V-108 M0 108 V132 M-132 0 H-108 M108 0 H132"/><path d="M0 -79 L21 -19 L79 0 L21 19 L0 79 L-21 19 L-79 0 L-21 -19Z" fill="${accent}" fill-opacity=".17"/><circle r="12" fill="${accent}"/></g>`;
    case "stars":return `<g fill="${accent}" opacity=".88">${star}<g transform="translate(-100 110) scale(.36)">${star}</g><g transform="translate(112 -80) scale(.50)">${star}</g></g>`;
    case "moon":return `<path d="M40 -103 A107 107 0 1 0 97 67 A95 95 0 0 1 40 -103Z" fill="${accent}" opacity=".73"/><g fill="${accent}"><circle cx="-85" cy="-91" r="7"/><circle cx="98" cy="-62" r="5"/><circle cx="96" cy="93" r="4"/></g>`;
    case "botanical":return `<g stroke="${accent}" stroke-width="4" fill="none"><path d="M-20 121 Q16 -16 29 -132"/><path d="M-7 48 Q-92 11 -76 -55 Q-16 -38 -7 48Z"/><path d="M11 -37 Q94 -76 81 -116 Q36 -110 11 -37Z"/><path d="M0 4 Q56 -20 68 18 Q29 38 0 4Z"/></g>`;
    case "constellation":return `<g stroke="${accent}" fill="none" stroke-width="3"><path d="M-116 78 L-70 -50 L5 22 L93 -90 L119 49"/><circle cx="-116" cy="78" r="10" fill="${accent}"/><circle cx="-70" cy="-50" r="8" fill="${accent}"/><circle cx="5" cy="22" r="11" fill="${accent}"/><circle cx="93" cy="-90" r="8" fill="${accent}"/><circle cx="119" cy="49" r="9" fill="${accent}"/></g>`;
    case "ribbon":return `<g fill="none" stroke="${accent}" stroke-width="4"><path d="M-75 -38 C-140 -104 -142 18 -55 15 C-2 10 0 -19 0 -19 C0 -19 2 10 55 15 C142 18 140 -104 75 -38 C41 -5 10 11 0 29 C-10 11 -41 -5 -75 -38Z"/><path d="M-12 17 Q-54 92 -59 125 L-13 105 L14 129 L4 23 M11 18 Q45 65 66 118 L38 112 L16 134"/></g>`;
    case "ring":return `<g stroke="${accent}" stroke-width="4" fill="none"><ellipse cx="0" cy="45" rx="100" ry="72"/><path d="M-33 -61 L0 -112 L33 -61 L24 -29 L-24 -29Z" fill="${accent}" fill-opacity=".12"/><path d="M-33 -61 H33 M0 -112 L-13 -61 L0 -29 L13 -61 L0 -112"/></g>`;
  }
}

function svgFor(slug:string,index:number):string{
  const t:GiftTheme=THEMES[slug as keyof typeof THEMES]??THEMES.pareja;
  const phase=index%5;
  const x=450+([-53,44,0,37,-36][phase]);
  const y=555+([30,-20,12,-35,32][phase]);
  const rotation=[-9,9,-2,13,-13][phase];
  const art=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100" preserveAspectRatio="xMidYMid slice" role="img">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.a}"/><stop offset=".57" stop-color="${t.b}"/><stop offset="1" stop-color="${t.a}"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="${t.c}" stop-opacity=".21"/><stop offset="1" stop-color="${t.c}" stop-opacity="0"/></radialGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.c}" stop-opacity=".8"/><stop offset="1" stop-color="${t.d}" stop-opacity=".28"/></linearGradient></defs>
    <rect width="900" height="1100" fill="url(#bg)"/>
    <ellipse cx="${x}" cy="${y}" rx="510" ry="520" fill="url(#glow)"/>
    <path d="M92 170 Q450 60 808 170 M92 936 Q450 1040 808 936" fill="none" stroke="${t.c}" stroke-opacity=".13" stroke-width="2"/>
    <rect x="54" y="54" width="792" height="992" rx="360" fill="none" stroke="url(#line)" stroke-opacity=".44" stroke-width="2"/>
    <rect x="77" y="77" width="746" height="946" rx="345" fill="none" stroke="${t.c}" stroke-opacity=".12"/>
    <g transform="translate(${x} ${y}) rotate(${rotation}) scale(1.55)" stroke-linecap="round" stroke-linejoin="round">${motif(t.kind,t.c)}</g>
    <g fill="${t.c}" opacity=".72">
      <circle cx="153" cy="204" r="3"/><circle cx="722" cy="330" r="2"/><circle cx="230" cy="839" r="3"/><circle cx="719" cy="872" r="2"/>
      <circle cx="300" cy="259" r="2"/><circle cx="619" cy="790" r="2"/>
    </g>
    <g stroke="${t.d}" stroke-opacity=".45" fill="none" stroke-width="2">
      <path d="M450 98 v30 M435 113 h30 M450 975 v30 M435 990 h30"/>
      <path d="M195 450 q-50 85 0 170 M705 450 q50 85 0 170"/>
    </g>
    <circle cx="${x}" cy="${y}" r="232" fill="none" stroke="${t.c}" stroke-opacity=".17" stroke-width="1.5"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(art);
}

export function privateGiftVisualUrl(slug:string,index:number):string{
  return svgFor(slug,index);
}

/**
 * Real uploads retain their exact order. Only absent slots are supplemented.
 * The route calls this; public demo engine inputs remain completely untouched.
 */
export function fillPrivateGiftPhotos<TScene extends string>(
  slug:string,
  recipe:readonly TScene[],
  uploads:readonly PrivateGiftPhoto<TScene>[],
):PrivateGiftPhoto<TScene>[]{
  const result:PrivateGiftPhoto<TScene>[]=[...uploads];
  for(const scene of recipe){
    const target=PRIVATE_PHOTO_SLOTS[scene]||0;
    if(!target)continue;
    const already=result.filter(photo=>(photo.scene||"memories")===scene).length;
    for(let index=already;index<target;index++){
      result.push({
        url:privateGiftVisualUrl(slug,recipe.indexOf(scene)*7+index),
        scene,
        fit:"cover",
        position:"center",
      });
    }
  }
  return result;
}
