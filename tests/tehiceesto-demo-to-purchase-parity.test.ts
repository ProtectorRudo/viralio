import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
import {experiences as liveModels} from "../src/app/tehiceesto/data";
import {experiences as frozenModels} from "../src/app/tehiceesto/template-v3/data";

const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TeHiceEsto demo-to-purchase parity: nine frozen + secret-v1",()=>{
  const legacyModels=liveModels.filter(model=>model.slug!=="secreto");
  const live=legacyModels.map(model=>model.slug).sort();
  it("freezes every advertised model, scene order and copy at sale time",()=>{
    expect(live).toHaveLength(9);
    expect(frozenModels.map(model=>model.slug).sort()).toEqual(live);
    expect(liveModels).toHaveLength(10);
    const secret=liveModels.find(model=>model.slug==="secreto");
    expect(secret?.recipe).toEqual(["invitation","portal","gallery","timepiece","recording","clues","confession","passage","reveal","keepsake"]);
    for(const demo of legacyModels){
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
  it("preserves v3 for previously sold gifts and creates new Pareja orders from frozen v4",()=>{
    const src=read("supabase/functions/order-create/index.ts");
    expect(src).toContain('slug==="pareja"?"premium-v4":"premium-v3"');
    expect(src).toContain("template_version:versionForNewGift(experienceSlug)");
    expect(src).toContain("templateVersion:templateVersion||");
    for(const model of liveModels){
      expect(src).toContain(`${model.slug}: ${JSON.stringify(model.recipe)}`);
    }
  });
  it("never strips missing media scenes when publishing a v3 gift",()=>{
    const src=read("supabase/functions/creator-api/index.ts");
    for(const model of liveModels){
      expect(src).toContain(`${model.slug}: ${JSON.stringify(model.recipe)}`);
    }
    expect(src).toContain('["premium-v3","premium-v4","secret-v1"].includes(gift.template_version)');
    expect(src).toContain("? [...canonical]");
    expect(src).toContain('!["premium-v3","premium-v4","secret-v1"].includes(gift.template_version) && !hasVoice');
    expect(src).toContain('!["premium-v3","premium-v4","secret-v1"].includes(gift.template_version) && !hasPhoto');
    expect(src).toContain('!["premium-v3","premium-v4","secret-v1"].includes(gift.template_version) && !hasVideo');
  });
  it("renders published gifts and both editors from the same frozen model",()=>{
    const page=read("src/app/tehiceesto/r/[code]/page.tsx");
    const customer=read("src/app/tehiceesto/editar/CustomerStudio.tsx");
    const admin=read("src/app/tehiceesto/admin/AdminGiftEditor.tsx");
    expect(page).toContain("frozenV3?PremiumV3Engine");
    expect(page).toContain("(frozenV3||frozenV4)?[...base.recipe]");
    expect(page).toContain("frozenV4?PremiumV4Engine");
    expect(customer).toContain("recipe:[...base.recipe]");
    expect(customer).toContain("<PremiumV3Engine");
    expect(customer).toContain("Tu experiencia conserva el recorrido completo del demo");
    expect(admin).toContain("PremiumV3Engine");
    expect(read("src/app/tehiceesto/r/[code]/layout.tsx")).toContain("tehiceesto-premium-v3.css");
    expect(read("src/app/tehiceesto/editar/layout.tsx")).toContain("tehiceesto-premium-v3.css");
  });
  it("never traps recipients or displays demo voices when a purchased gift has no audio",()=>{
    const engine=read("src/app/tehiceesto/template-v3/ExperienceEngine.tsx");
    const css=read("src/app/tehiceesto/tehiceesto-premium-v3.css");
    expect(engine).toContain('if(customerGift&&currentAudios.length===0)');
    expect(engine).toContain('className="thi-scene thi-scene-voices thi-scene-rich thi-gift-voices-no-audio"');
    expect(engine).toContain('data-action="advance" className="thi-primary thi-gift-voices-silent-next" onClick={next}');
    expect(engine).toContain("Hay palabras que no necesitan grabarse para quedarse con vos.");
    expect(css).toContain(".thi-template-v3 .thi-gift-voices-silent");
    expect(css).toContain("@media(max-width:600px)");
  });

});
