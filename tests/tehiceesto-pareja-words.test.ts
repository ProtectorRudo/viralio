import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getExperience } from "../src/app/tehiceesto/data";
import { getExperienceCopy } from "../src/app/tehiceesto/experienceCopy";
import { premiumMoments } from "../src/app/tehiceesto/premiumMoments";

const file=(p:string)=>readFileSync(resolve(process.cwd(),"src/app/tehiceesto",p),"utf8");

describe("Pareja: natural and intimate demo copy",()=>{
  const experience=getExperience("pareja");
  if(!experience)throw new Error("missing pareja demo");
  const copy=getExperienceCopy(experience);

  it("shows exactly the requested new opening line",()=>{
    expect(copy.intro.footnote).toBe("Lo nuestro merece estar en un lugar así.");
    expect(copy.intro.footnote).not.toMatch(/también merecía/);
  });

  it("reveals five distinct and meaningful compliments without losing the interactive order",()=>{
    expect(copy.stars.items).toHaveLength(5);
    expect(copy.stars.items).toEqual([
      "Me encanta cómo se te ilumina la cara cuando algo te hace feliz.",
      "Tenés una risa que siempre me termina contagiando.",
      "Admiro cómo cuidás a la gente que querés, hasta en los detalles chiquitos.",
      "Me gusta que con vos puedo ser yo, incluso en mis días más raros.",
      "Y por si no te lo digo seguido: me seguís gustando muchísimo.",
    ]);
    const engine=file("ExperienceEngine.tsx");
    expect(engine).toContain('disabled={!active}');
    expect(engine).toContain('setStars(v=>[...v,i])');
    expect(engine).toContain('token(starLines[lastStar])');
  });

  it("announces the surprise before holding the heart",()=>{
    expect(copy.hold.title).toEqual(["Antes de la sorpresa,","quiero que sientas esto."]);
    const engine=file("ExperienceEngine.tsx");
    expect(engine).toContain('cinematic={experience.slug==="pareja"}');
    expect(engine).toContain('onReveal={()=>{setHoldRevealed(true)');
  });

  it("uses a natural future-facing message when the heart is held",()=>{
    expect(copy.hold.reveal).toBe(
      "Todavía nos quedan un montón de cosas por vivir. Me encanta pensar que van a ser con vos.",
    );
    expect(premiumMoments.pareja.hold.reveal).toBe(copy.hold.reveal);
  });

  it("keeps frozen gift versions and other nine-demo category content separate",()=>{
    const frozenV1=file("template-v1/premiumMoments.ts");
    const frozenV2=file("template-v2/premiumMoments.ts");
    for(const source of [frozenV1,frozenV2]){
      expect(source).toContain("Entre todas las versiones de mi vida");
      expect(source).not.toContain("Todavía nos quedan un montón de cosas por vivir");
    }
    const others=["mama","papa","hijos","cumpleanos","abuelos","amistad","aniversario","propuesta"];
    expect(others.every(slug=>Boolean(getExperience(slug)))).toBe(true);
    expect(copy.stars.items.every(line=>line.trim().length>20)).toBe(true);
  });
});
