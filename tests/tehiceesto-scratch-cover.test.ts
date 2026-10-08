import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { experiences } from "../src/app/tehiceesto/data";
import {
  SCRATCH_COVER_PALETTES,
  getScratchCoverPalette,
} from "../src/app/tehiceesto/scratchCoverThemes";

const source=(path:string)=>readFileSync(resolve(process.cwd(),"src/app/tehiceesto",path),"utf8");
const rgb=(hex:string)=>(hex.slice(1).match(/../g)||[]).map((n)=>parseInt(n,16)/255);
const luminance=(rgbValues:number[])=>(rgbValues.map((v)=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4))
  .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);

describe("TeHiceEsto themed scratch foil",()=>{
  it("covers all actual demo slugs, including future models with the scratch scene",()=>{
    expect(Object.keys(SCRATCH_COVER_PALETTES).sort()).toEqual(experiences.map((e)=>e.slug).sort());
    for(const experience of experiences){
      expect(getScratchCoverPalette(experience.slug)).toBe(SCRATCH_COVER_PALETTES[experience.slug as keyof typeof SCRATCH_COVER_PALETTES]);
    }
  });

  it("keeps the small white canvas instructions legible over the center of every foil",()=>{
    for(const [slug,palette] of Object.entries(SCRATCH_COVER_PALETTES)){
      expect(palette.stops).toHaveLength(5);
      palette.stops.forEach(color=>expect(color).toMatch(/^#[0-9a-f]{6}$/i));
      // Middle of the diagonal gradient blends the .45 and .70 stops.
      const between=rgb(palette.stops[2]).map((v,i)=>v*.8+rgb(palette.stops[3])[i]*.2);
      expect(1.05/(luminance(between)+.05),slug).toBeGreaterThan(4.5);
    }
  });

  it("replaces the hardcoded metallic gold in the live scratch canvas only",()=>{
    const live=source("ScratchReveal.tsx");
    const engine=source("ExperienceEngine.tsx");
    expect(live).toContain('getScratchCoverPalette(themeSlug)');
    expect(live).toContain('palette.stops.forEach');
    expect(live).not.toContain('#f8e3a6');
    expect(live).not.toContain('#b77b1f');
    expect(engine).toContain('themeSlug={experience.slug}');
    // Eraser behavior, pointer capture and unlock percentage are unchanged.
    expect(live).toContain('ctx.globalCompositeOperation="destination-out"');
    expect(live).toContain('setPointerCapture(event.pointerId)');
    expect(live).toContain('if(progress>=.56)completeReveal()');
  });

  it("leaves frozen customer-template engines and scratch components unchanged",()=>{
    for(const version of ["template-v1","template-v2"]){
      const engine=source(`${version}/ExperienceEngine.tsx`);
      const foil=source(`${version}/ScratchReveal.tsx`);
      expect(engine).not.toContain("scratchCoverThemes");
      expect(foil).not.toContain("scratchCoverThemes");
      expect(engine).toContain("ScratchReveal");
    }
  });
});
