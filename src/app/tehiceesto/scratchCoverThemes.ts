/**
 * Curated foil palettes for the live TeHiceEsto scratch-to-reveal scene.
 *
 * The foil is painted on a <canvas>, so plain CSS overrides do not change
 * its color. Keep this small data module aligned with the demo catalogue.
 * Frozen premium-v1 and premium-v2 snapshots deliberately do not import it.
 */
export type ScratchCoverPalette={
  readonly stops:readonly [string,string,string,string,string];
  readonly lineLight:string;
  readonly lineDark:string;
  readonly textPrimary:string;
  readonly textSecondary:string;
};

export const SCRATCH_COVER_PALETTES={
  // Velvet wine with a dusky rose sheen.
  pareja:{
    stops:["#ac6d88","#6a2c4c","#915472","#482037","#773853"],
    lineLight:"#e8b4c9",lineDark:"#3c1c33",
    textPrimary:"#fff5f8",textSecondary:"#f0d6e0",
  },
  // Powder-rose and warm peach; soft but legible against the lettering.
  mama:{
    stops:["#f0b7ac","#aa6875","#d39495","#935766","#c17d82"],
    lineLight:"#ffddd0",lineDark:"#79465b",
    textPrimary:"#fff9f5",textSecondary:"#ffeae3",
  },
  // Petrol-blue, blue-grey and muted steel.
  papa:{
    stops:["#7795a2","#2c4b61","#557489","#203d55","#3c6377"],
    lineLight:"#c4dce5",lineDark:"#182f43",
    textPrimary:"#f8fbff",textSecondary:"#d8e4ed",
  },
  // Lively plum and muted coral, without the old metallic gold.
  cumpleanos:{
    stops:["#dd929d","#87496f","#bc6c90","#69395e","#a25b82"],
    lineLight:"#f8c4cb",lineDark:"#572848",
    textPrimary:"#fff8fb",textSecondary:"#f8dfe8",
  },
  // Deep mint and turquoise, easy to read on small phones.
  hijos:{
    stops:["#91bcae","#3d7b79","#6aa296","#2c6267","#4c8781"],
    lineLight:"#d4eee1",lineDark:"#225453",
    textPrimary:"#f7fff9",textSecondary:"#d9f5ec",
  },
  // Dusty lavender, soft stone and memory-paper undertones.
  abuelos:{
    stops:["#b1a3ba","#6a5a7b","#9582a4","#514761","#796787"],
    lineLight:"#e5d9e9",lineDark:"#453c55",
    textPrimary:"#fffafe",textSecondary:"#ede4f2",
  },
  // Analog blue with an ink-violet reflection.
  amistad:{
    stops:["#91a9c4","#406384","#6988a8","#2c466c","#516c96"],
    lineLight:"#d6e4f2",lineDark:"#283954",
    textPrimary:"#f9fbff",textSecondary:"#dfe8f7",
  },
  // Plum, mauve and rose-pink, subtly cinematic.
  aniversario:{
    stops:["#c493af","#784761","#ae7396","#533651","#91617a"],
    lineLight:"#f4cadb",lineDark:"#492c46",
    textPrimary:"#fff9fc",textSecondary:"#f5deed",
  },
  // Soft pearlescent taupe, champagne rose without yellow-metallic foil.
  propuesta:{
    stops:["#d0bbb8","#8e747c","#b49ca2","#6e5865","#9d818b"],
    lineLight:"#f3e4de",lineDark:"#594554",
    textPrimary:"#fffaf7",textSecondary:"#f6e9e8",
  },
} as const satisfies Record<string,ScratchCoverPalette>;

export function getScratchCoverPalette(slug:string):ScratchCoverPalette{
  return SCRATCH_COVER_PALETTES[slug as keyof typeof SCRATCH_COVER_PALETTES]
    ?? SCRATCH_COVER_PALETTES.pareja;
}
