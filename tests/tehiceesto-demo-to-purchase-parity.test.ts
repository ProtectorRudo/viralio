import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
import {experiences as liveModels} from "../src/app/tehiceesto/data";
import {experiences as frozenModels} from "../src/app/tehiceesto/template-v3/data";

const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TeHiceEsto demo-to-purchase parity: all nine products",()=>{
  const live=liveModels.map(model=>model.slug).sort();
  it("freezes every advertised model, scene order and copy at sale time",()=>{
    expect(live).toHaveLength(9);
    expect(frozenModels.map(model=>model.slug).sort()).toEqual(live);
    for(const demo of liveModels){
      const sold=frozenModels.find(x=>x.slug===demo.slug);
      expect(sold).toBeDefined();
      expect(sold!.recipe).toEqual(demo.recipe);
      expect(sold!.opening).toEqual(demo.opening);
      expect(sold!.closing).toEqual(demo.closing);
      expect(sold!.demo).toEqual(demo.demo);
      expect(sold!.recipe.length).toBeGreaterThanOrEqual(8);
    }
  });
  it("ships independent JS + CSS snapshots that cannot change when the live demo evolves",()=>{
    const engine=read("src/app/tehiceesto/template-v3/ExperienceEngine.tsx");
    const liveEngine=read("src/app/tehiceesto/ExperienceEngine.tsx");
    const frozenCSS=read("src/app/tehiceesto/tehiceesto-premium-v3.css");
    expect(engine).toContain("thi-template-v3");
    expect(engine).not.toContain("thi-template-live");
    expect(liveEngine).toContain("thi-template-live");
    expect(engine).toContain("./BirthdayLantern");
    expect(engine).toContain("./PairEverydayScene");
    expect(frozenCSS).toContain(".thi-template-v3");
    expect(frozenCSS).not.toContain(".thi-template-live");
  });
  it("creates new orders from the frozen v3 recipe, not v2",()=>{
    const src=read("supabase/functions/order-create/index.ts");
    expect(src).toContain('template_version:"premium-v3"');
    expect(src).toContain('templateVersion:"premium-v3"');
    for(const model of liveModels){
      expect(src).toContain(`${model.slug}: ${JSON.stringify(model.recipe)}`);
    }
  });
  it("never strips missing media scenes when publishing a v3 gift",()=>{
    const src=read("supabase/functions/creator-api/index.ts");
    for(const model of liveModels){
      expect(src).toContain(`${model.slug}: ${JSON.stringify(model.recipe)}`);
    }
    expect(src).toContain('gift.template_version==="premium-v3"');
    expect(src).toContain("?[...canonical]");
    expect(src).toContain('gift.template_version!=="premium-v3" && !hasVoice');
    expect(src).toContain('gift.template_version!=="premium-v3" && !hasPhoto');
    expect(src).toContain('gift.template_version!=="premium-v3" && !hasVideo');
  });
  it("renders published gifts and both editors from the same frozen model",()=>{
    const page=read("src/app/tehiceesto/r/[code]/page.tsx");
    const customer=read("src/app/tehiceesto/editar/CustomerStudio.tsx");
    const admin=read("src/app/tehiceesto/admin/AdminGiftEditor.tsx");
    expect(page).toContain("frozenV3?PremiumV3Engine");
    expect(page).toContain("frozenV3?[...base.recipe]");
    expect(customer).toContain("recipe:[...base.recipe]");
    expect(customer).toContain("<PremiumV3Engine");
    expect(customer).toContain("Tu experiencia conserva el recorrido completo del demo");
    expect(admin).toContain("PremiumV3Engine");
    expect(read("src/app/tehiceesto/r/[code]/layout.tsx")).toContain("tehiceesto-premium-v3.css");
    expect(read("src/app/tehiceesto/editar/layout.tsx")).toContain("tehiceesto-premium-v3.css");
  });
});
