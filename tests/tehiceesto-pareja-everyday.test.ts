import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
import { experiences,getExperience } from "../src/app/tehiceesto/data";
import { getExperienceCopy } from "../src/app/tehiceesto/experienceCopy";

const file=(p:string)=>readFileSync(resolve(process.cwd(),"src/app/tehiceesto",p),"utf8");

describe("Pareja cinematic everyday room",()=>{
  const pareja=getExperience("pareja");
  if(!pareja)throw new Error("Pareja demo missing");

  it("adds exactly one scene between lights and surprise; all other demos unchanged",()=>{
    const recipe=pareja.recipe;
    expect(recipe.filter(scene=>scene==="everyday")).toHaveLength(1);
    const stars=recipe.indexOf("stars");
    expect(recipe[stars+1]).toBe("everyday");
    expect(recipe[stars+2]).toBe("scratch");
    for(const experience of experiences.filter(item=>item.slug!=="pareja")){
      expect(experience.recipe.includes("everyday")).toBe(false);
    }
  });

  it("has exactly three independent personalizable phrases and a genuine ending",()=>{
    const copy=getExperienceCopy(pareja).everyday;
    expect(copy.moments).toHaveLength(3);
    expect(copy.moments.every(item=>item.trim().length>30)).toBe(true);
    expect(copy.title).toBe("¿Sabés qué es lo que más me gusta de nosotros?");
    expect(copy.closing).toBe("No necesito que todos nuestros días sean especiales. Me alcanza con que sean con vos.");
  });

  it("requires the three room discoveries before showing the continue action",()=>{
    const component=file("PairEverydayScene.tsx");
    expect(component).toContain("const complete=opened.length===total;");
    expect(component).toContain("onClick={()=>discover(index)}");
    expect(component).toContain('key="ending"');
    expect(component).toContain('{complete&&<button');
    for(const spot of ["cups","window","frame"])expect(component).toContain(`key:"${spot}"`);
  });

  it("never falls back to stranger photos for paid customers",()=>{
    const engine=file("ExperienceEngine.tsx");
    expect(engine).toContain('case"everyday":return <PairEverydayScene');
    expect(engine).toContain('photoUrl={customerGift');
    expect(engine).toContain('item.url&&!item.url.startsWith("data:")');
    const component=file("PairEverydayScene.tsx");
    expect(component).toContain('thi-everyday-photo-art');
    expect(component).toContain('alt=""');
  });

  it("keeps the live model's copy editable and the frozen templates untouched",()=>{
    const editor=file("admin/ScriptEditor.tsx");
    for(const property of ["kicker","title","hint","moments","closing","cta"]){
      expect(editor).toContain(`path:"everyday.${property}"`);
    }
    for(const version of ["template-v1","template-v2"]){
      expect(file(`${version}/ExperienceEngine.tsx`)).not.toContain("PairEverydayScene");
      expect(file(`${version}/data.ts`)).not.toContain('"everyday"');
    }
    expect(file("layout.tsx")).toContain('import "./tehiceesto-everyday.css";');
  });
});