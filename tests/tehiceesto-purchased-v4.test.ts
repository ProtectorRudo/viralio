import {describe,expect,it} from "vitest";
import { readFileSync } from "node:fs";
import { getExperience as getV3 } from "../src/app/tehiceesto/template-v3/data";
import { getExperience as getV4 } from "../src/app/tehiceesto/template-v4/data";
import { getExperienceCopy as getV4Copy } from "../src/app/tehiceesto/template-v4/experienceCopy";

function file(name:string){
  return readFileSync(new URL(`../src/app/tehiceesto/${name}`,import.meta.url),"utf8");
}

describe("Frozen personalized Pareja with tactile rose and secret paper",()=>{
  it("keeps the v3 recipe intact for previously sold gifts",()=>{
    const old=getV3("pareja");
    const next=getV4("pareja");
    expect(old).toBeDefined();
    expect(next).toBeDefined();
    expect(next!.recipe).toEqual(old!.recipe);
    expect(next!.recipe.at(-1)).toBe("finale");
  });

  it("freezes the same finale text as the public demo, with per-gift overrides",()=>{
    const base=getV4("pareja")!;
    const defaults=getV4Copy(base);
    expect(defaults.finale.roseMessage).toBe("Te amo");
    expect(defaults.finale.roseSubtitle).toBe("Y te volvería a elegir.");
    const custom=getV4Copy(base,{finale:{roseMessage:"Te adoro",roseSubtitle:"Nuestra historia continúa"}}); 
    expect(custom.finale.roseMessage).toBe("Te adoro");
    expect(custom.finale.roseSubtitle).toBe("Nuestra historia continúa");
  });

  it("freezes rose+paper state machine in the actual purchased model instead of a demo-only patch",()=>{
    const engine=file("template-v4/ExperienceEngine.tsx");
    const rose=file("template-v4/PairRoseFinale.tsx");
    expect(engine).toContain('import PairRoseFinale from "./PairRoseFinale"');
    expect(engine).toContain("if(experience.slug===\"pareja\")");
    expect(engine).toContain("<PairRoseFinale");
    expect(rose).toContain("thi-rose-note-paper");
    expect(rose).toContain("setNoteRevealed(true)");
    expect(rose).toContain("setCelebrating(true)");
    expect(rose).toContain("vibrate([11,34,13])");
  });

  it("routes v4 purchased and admin versions to frozen models, not to the legacy v3 engine",()=>{
    const page=file("r/[code]/page.tsx");
    const editor=file("admin/AdminGiftEditor.tsx");
    expect(page).toContain('templateVersion==="premium-v4"');
    expect(page).toContain("frozenV4?PremiumV4Engine:ExperienceEngine");
    expect(editor).toContain('gift?.template_version==="premium-v4"');
    expect(editor).toContain("getPremiumV4ExperienceCopy");
    expect(page).toContain("<Engine customerGift");
    expect(file("template-v4/ExperienceEngine.tsx")).toContain("!customerGift&&<Link");
  });
});
