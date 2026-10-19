import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
import {experiences as liveModels} from "../src/app/tehiceesto/data";
import {experiences as frozenModels} from "../src/app/tehiceesto/template-v3/data";
import {experiences as v5Models} from "../src/app/tehiceesto/template-v5/data";

const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TeHiceEsto demo-to-purchase parity: nine frozen premium models",()=>{
  const live=liveModels.map(model=>model.slug).sort();
  it("freezes every advertised model, scene order and copy at sale time",()=>{
    expect(live).toHaveLength(9);
    expect(frozenModels.map(model=>model.slug).sort()).toEqual(live);
    expect(liveModels).toHaveLength(9);
    for(const demo of liveModels){
      const sold=(demo.slug==="amistad"?v5Models:frozenModels).find(x=>x.slug===demo.slug);
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
  it("preserves v3 for previously sold gifts and creates new Pareja orders from frozen v5",()=>{
    const src=read("supabase/functions/order-create/index.ts");
    expect(src).toContain('["pareja","mama","amistad"].includes(slug)?"premium-v5":"premium-v3"');
    expect(src).toContain("template_version:versionForNewGift(experienceSlug)");
    expect(src).toContain("templateVersion:templateVersion||");
    for(const model of liveModels){
      expect(src).toContain(`${model.slug}: ${JSON.stringify(model.recipe)}`);
    }
  });
  it("preserves all media-bearing scene designs unless a customer explicitly hides an optional chapter",()=>{
    const src=read("supabase/functions/creator-api/index.ts");
    for(const model of liveModels){
      expect(src).toContain(`${model.slug}: ${JSON.stringify(model.recipe)}`);
    }
    expect(src).toContain('const recipe = cleanStudioRecipe(canonicalRecipeForGift(gift, story), body.sceneRecipe)');
    expect(src).toContain("let publishRecipe = cleanStudioRecipe(");
    expect(src).toContain('if (canonical.includes("intro") && !publishRecipe.includes("intro"))');
    expect(src).toContain('!["premium-v3","premium-v4","premium-v5"].includes(gift.template_version) && !hasVoice');
    expect(src).toContain('!["premium-v3","premium-v4","premium-v5"].includes(gift.template_version) && !hasPhoto');
    expect(src).toContain('!["premium-v3","premium-v4","premium-v5"].includes(gift.template_version) && !hasVideo');
  });
  it("renders published gifts and both editors from the same frozen model",()=>{
    const page=read("src/app/tehiceesto/r/[code]/page.tsx");
    const customer=read("src/app/tehiceesto/editar/CustomerStudio.tsx");
    const admin=read("src/app/tehiceesto/admin/AdminGiftEditor.tsx");
    expect(page).toContain("frozenV3?PremiumV3Engine");
    expect(page).toContain("(frozenV3||frozenV4||frozenV5)?[...storedRecipe]");
    expect(page).toContain("frozenV4?PremiumV4Engine");
    expect(customer).toContain("recipe:base.recipe.filter(scene=>gift.scene_recipe.includes(scene)");
    expect(customer).toContain("<PremiumV3Engine");
    expect(customer).toContain("Podés quitar una parte opcional sin perderla");
    expect(admin).toContain("PremiumV3Engine");
    expect(read("src/app/tehiceesto/r/[code]/layout.tsx")).toContain("tehiceesto-premium-v3.css");
    expect(read("src/app/tehiceesto/editar/layout.tsx")).toContain("tehiceesto-premium-v3.css");
  });
  it("allows reversible optional section hiding across preview, published route and future gifts",()=>{
    const studio=read("src/app/tehiceesto/editar/CustomerStudio.tsx");
    const published=read("src/app/tehiceesto/r/[code]/page.tsx");
    const edge=read("supabase/functions/creator-api/index.ts");
    expect(studio).toContain('aria-label={visible?`Quitar sección ${meta.title}`:`Recuperar sección ${meta.title}`}');
    expect(studio).toContain('const visible=gift.scene_recipe.includes(scene)');
    expect(studio).toContain('recipe:base.recipe.filter(scene=>gift.scene_recipe.includes(scene)');
    expect(published).toContain('base.recipe.filter(scene=>selectedScenes.includes(scene)||scene==="intro"||scene==="finale"||scene==="proposal")');
    expect(edge).toContain("let publishRecipe = cleanStudioRecipe(");
    expect(edge).not.toContain('const reactivated = canonical.filter');
  });
  it("uses real customer photos in other chapters and never truncates Mamá's album to three",()=>{
    for(const version of ["v3","v4","v5"]){
      const source=read(`src/app/tehiceesto/template-${version}/privateGiftVisuals.ts`);
      expect(source).toContain('if(realPhotos.length)');
      expect(source).toContain('const available=realPhotos.filter');
      expect(source).toContain('if(scenePhotos.length>=target)continue');
    }
    const engine=read("src/app/tehiceesto/template-v5/ExperienceEngine.tsx");
    expect(engine).toContain('const mamaMemoryItems=');
    expect(engine).toContain('.slice(0,customerGift?20:3)');
  });
  it("includes the complete version-five rose, heart and editor integration",()=>{const engine=read("src/app/tehiceesto/template-v5/ExperienceEngine.tsx");expect(engine).toContain("thi-template-v5");expect(engine).toContain("./PairRoseFinaleCinematic");expect(engine).toContain("const scenes=experience.recipe;");expect(read("src/app/tehiceesto/admin/ScriptEditor.tsx")).toContain("finale.roseMessage");expect(read("src/app/tehiceesto/pedido/[code]/page.tsx")).toContain('templateVersion==="premium-v5"');});
  it("locks Mama demo and personalized gifts to the same premium-v5 snapshot without affecting assisted Pareja",()=>{
    const demo=read("src/app/tehiceesto/experiencias/[slug]/page.tsx");
    const studio=read("src/app/tehiceesto/editar/CustomerStudio.tsx");
    const account=read("src/app/tehiceesto/mis-regalos/MyGifts.tsx");
    const creator=read("supabase/functions/creator-api/index.ts");
    const accountEdge=read("supabase/functions/gift-account/index.ts");
    const versioned=read("src/app/tehiceesto/template-v5/ExperienceEngine.tsx");
    const giftPage=read("src/app/tehiceesto/r/[code]/page.tsx");
    const v5Data=read("src/app/tehiceesto/template-v5/data.ts");
    expect(demo).toContain('mamaV5?<PremiumV5Engine experience={mamaV5}/>');
    expect(versioned).toContain('thi-template-v5');
    expect(v5Data).toContain('slug:"mama"');
    expect(giftPage).toContain('frozenV5?PremiumV5Engine:ExperienceEngine');
    expect(studio).toContain('gift.template_version==="premium-v5"&&["mama","amistad"].includes(gift.experience_slug)');
    expect(studio).toContain('photoMedia={withChoices(fillV5GiftPhotos(');
    expect(account).toContain('gift.templateVersion === "premium-v5" && gift.experienceSlug === "pareja"');
    expect(creator).toContain('gift.template_version === "premium-v5" && gift.experience_slug === "pareja"');
    expect(accountEdge).toContain('gift?.template_version==="premium-v5"&&gift?.experience_slug==="pareja"');
    expect(creator).toContain('["pareja","mama","amistad"].includes(experienceSlug) ? "premium-v5" : "premium-v3"');
  });
  it("uses one 11-scene friendship v5 model from demo to checkout to customer studio",()=>{
    const liveFriend=liveModels.find(model=>model.slug==="amistad")!;
    const v5Friend=v5Models.find(model=>model.slug==="amistad")!;
    const previous=frozenModels.find(model=>model.slug==="amistad")!;
    expect(liveFriend.recipe).toEqual(["intro","door","casefile","memories","insidejokes","incidents","proof","puzzle","letter","pact","finale"]);
    expect(v5Friend.recipe).toEqual(liveFriend.recipe);
    expect(previous.recipe).not.toContain("puzzle");
    const engine=read("src/app/tehiceesto/template-v5/ExperienceEngine.tsx");
    const demo=read("src/app/tehiceesto/experiencias/[slug]/page.tsx");
    const customer=read("src/app/tehiceesto/editar/CustomerStudio.tsx");
    const puzzle=read("src/app/tehiceesto/FriendshipPhotoPuzzle.tsx");
    expect(engine).toContain('variant="amistad"');
    expect(engine).toContain('experience.slug==="pareja"||experience.slug==="amistad"?<PairCinematicUmbral');
    expect(engine).toContain('type==="puzzle"');
    expect(puzzle).toContain('data-friend-puzzle');
    expect(puzzle).toContain('onSolved()');
    expect(demo).toContain('friendshipV5');
    expect(customer).toContain('["mama","amistad"].includes(gift.experience_slug)');
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
