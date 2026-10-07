import { mkdirSync } from "node:fs";
import { expect,test,type Page,type TestInfo } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./gift-flow";

async function capture(page:Page,testInfo:TestInfo,name:string){
  mkdirSync("visual-qa-evidence",{recursive:true});
  const path=`visual-qa-evidence/${name}.png`;
  await page.screenshot({path,fullPage:true});
  await testInfo.attach(name,{path,contentType:"image/png"});
}

test("Te Hice Esto premium rebuild visual contract",async({page},testInfo)=>{
  test.setTimeout(90_000);
  await page.emulateMedia({reducedMotion:"no-preference"});

  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/tehiceesto");
  await expect(page.getByRole("heading",{name:/Un regalo que la emociona/i})).toBeVisible();
  await expect(page.locator(".thh-v2-chooser")).toBeVisible();
  await expect(page.getByRole("link",{name:"Ver experiencia para Mamá"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Ver experiencia para Papá"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Ver experiencia para Amistad"})).toBeVisible();
  await expect(page.getByRole("heading",{name:/No recibe solo un regalo/i})).toBeVisible();
  await expect(page.getByText("Nosotros hacemos la magia")).toBeVisible();
  await expect(page.locator(".floating-whatsapp--home")).toBeHidden();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-home-1440");

  await page.goto("/tehiceesto/crear");
  await expect(page.getByRole("heading",{name:/Elegí la que más se parece a/i})).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-creator-1440");

  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto");
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-home-390");

  await page.goto("/tehiceesto/crear");
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-creator-390");

  await page.goto("/tehiceesto/experiencias/pareja");
  await expect(page.getByText("Lo nuestro también merecía un lugar así.")).toBeVisible();
  await expect(page.getByText(/Ponete auriculares/i)).toHaveCount(0);
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-pareja-intro-390");
  await page.getByRole("button",{name:/Entrá despacio/i}).click();
  await expect(page.getByRole("heading",{name:/A veces empieza/i})).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await page.locator(".thi-pair-threshold-door").click();
  await expect(page.getByText("Del otro lado estamos nosotros.")).toBeVisible();
  await expect(page.getByRole("button",{name:/Seguir entrando/i})).toBeVisible();
  await expect.poll(async()=>{
    return page.locator(".thi-pair-threshold-leaf").evaluate((node)=>{
      const matrix=new DOMMatrix(getComputedStyle(node).transform);
      return Math.abs(matrix.m11);
    });
  }).toBeGreaterThan(.35);
  await expect.poll(async()=>{
    return page.locator(".thi-pair-threshold-leaf").evaluate((node)=>{
      const matrix=new DOMMatrix(getComputedStyle(node).transform);
      return Math.abs(matrix.m11);
    });
  }).toBeLessThan(.68);
  await expect.poll(async()=>{
    return page.locator(".thi-pair-threshold-leaf").evaluate((node)=>
      getComputedStyle(node).getPropertyValue("--door-swing-direction").trim()
    );
  }).toBe("inward");
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-pareja-threshold-390");

  await page.getByRole("button",{name:/Seguir entrando/i}).click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","memories");
  await page.locator('.thi-scene-memories [data-action="advance"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","voices");
  await page.locator('[data-action="demo-voice"]').first().click();
  await page.locator('[data-action="advance"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","light");
  await expect(page.getByRole("heading",{name:"Encontralo."})).toHaveCount(1);
  await expect(page.locator(".thi-light-photo-reveal img")).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  const lightReveal=page.locator(".thi-light-reveal-cinematic");
  await lightReveal.hover({position:{x:118,y:290}});
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-pareja-light-search-390");
  await lightReveal.click({position:{x:150,y:280}});
  await expect(page.getByText("No recuerdo exactamente qué dijimos. Sí recuerdo que no quería que terminara.")).toBeVisible();
  await expect(page.getByRole("button",{name:/Seguir con este recuerdo/i})).toBeVisible();
  await page.waitForTimeout(1250);
  await capture(page,testInfo,"tehiceesto-premium-pareja-light-revealed-390");

  await page.getByRole("button",{name:/Seguir con este recuerdo/i}).click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","stars");
  await expect(page.getByRole("heading",{name:/Hay cosas tuyas/i})).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-pair-star-node.is-active")).toHaveCount(1);
  await page.locator(".thi-pair-star-node.is-active").click();
  await expect(page.getByText(/Cómo hacés hogar/i)).toBeVisible();
  await page.locator(".thi-pair-star-node.is-active").click();
  await expect(page.getByText(/Tu risa cuando algo te causa gracia de verdad/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-pareja-constellation-progress-390");

  while(await page.locator(".thi-pair-star-node.is-active").count()){
    await page.locator(".thi-pair-star-node.is-active").click();
  }
  await expect(page.getByText("Ya estaban todas ahí.")).toBeVisible();
  await expect(page.getByText(/Cinco cosas tuyas que Julián no quería dejar sin decir/i)).toBeVisible();
  await expect(page.getByRole("button",{name:/Me las guardo/i})).toBeVisible();
  await capture(page,testInfo,"tehiceesto-premium-pareja-constellation-complete-390");

  for(const [slug,scene,openSelector] of [
    ["abuelos","archive",".archive-folder"],
    ["mama","childhood",null],
    ["propuesta","origin",null],
    ["amistad","casefile",".casefile-folder"],
  ] as const){
    await page.goto(`/tehiceesto/experiencias/${slug}`);
    await page.locator('[data-action="advance"]').click();
    await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene",scene);
    if(openSelector) await page.locator(openSelector).click();
    await page.waitForTimeout(350);
    await expectNoHorizontalOverflow(page);
    await capture(page,testInfo,`tehiceesto-premium-${slug}-390`);
  }

  await page.goto("/tehiceesto/experiencias/papa");
  await page.locator('[data-action="advance"]').click();
  await page.locator('[data-action="advance"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","lessons");
  await expect(page.locator(".thi-papa-lesson-card")).toHaveCount(4);
  await page.locator(".thi-papa-lesson-card").nth(1).click();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-papa-390");
});


test("Papa premium release visual contract",async({page},testInfo)=>{
  test.setTimeout(75_000);
  await page.addInitScript(()=>{
    class FakeUtterance{
      text:string;lang="";rate=1;pitch=1;voice:null=null;
      onboundary:((event:{charIndex:number})=>void)|null=null;
      onend:(()=>void)|null=null;onerror:(()=>void)|null=null;
      constructor(text:string){this.text=text}
    }
    const state={current:null as FakeUtterance|null};
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:FakeUtterance});
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
      getVoices:()=>[],
      speak:(utterance:FakeUtterance)=>{state.current=utterance},
      pause:()=>{},resume:()=>{},cancel:()=>{},
    }});
    (window as unknown as {__papaSpeech:typeof state}).__papaSpeech=state;
  });
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/papa");

  await page.waitForTimeout(850);
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-papa-release-01-intro-390");

  await page.locator('[data-action="advance"]').click();
  await page.waitForTimeout(850);
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","memories");
  await capture(page,testInfo,"tehiceesto-papa-release-02-memories-390");

  await page.locator('[data-action="advance"]').click();
  await page.waitForTimeout(850);
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","lessons");
  await expect(page.locator(".thi-papa-lesson-card")).toHaveCount(4);
  await capture(page,testInfo,"tehiceesto-papa-release-03-lessons-emotional-390");
  for(const i of [1,2,3]) await page.locator(".thi-papa-lesson-card").nth(i).click();
  await page.waitForTimeout(500);
  await capture(page,testInfo,"tehiceesto-papa-release-04-lessons-complete-390");
  await page.locator(".thi-papa-lessons-cta").click();
  await page.waitForTimeout(850);
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","presence");
  await expect(page.locator(".thi-papa-presence-card")).toHaveCount(3);
  await capture(page,testInfo,"tehiceesto-papa-release-05-presence-silent-390");
  for(const i of [1,2]) await page.locator(".thi-papa-presence-card").nth(i).click();
  await page.waitForTimeout(500);
  await capture(page,testInfo,"tehiceesto-papa-release-06-presence-complete-390");
  await page.locator(".thi-papa-presence-cta").click();
  await page.waitForTimeout(850);
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","inheritance");
  await expect(page.locator(".thi-papa-inheritance-card")).toHaveCount(4);
  await capture(page,testInfo,"tehiceesto-papa-release-07-inheritance-deep-390");
  for(const i of [1,2,3]) await page.locator(".thi-papa-inheritance-card").nth(i).click();
  await page.waitForTimeout(500);
  await capture(page,testInfo,"tehiceesto-papa-release-08-inheritance-complete-390");
  await page.locator(".thi-papa-inheritance-cta").click();
  await page.waitForTimeout(850);

  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","voices");
  await expect(page.locator(".thi-papa-voice-card-v2")).toHaveCount(3);
  await capture(page,testInfo,"tehiceesto-papa-release-09-voices-idle-390");

  const voiceControls=page.locator(".thi-papa-voice-control");
  await voiceControls.nth(0).click();
  await page.evaluate(()=>{const state=(window as unknown as {__papaSpeech:{current:{text:string;onboundary?:((event:{charIndex:number})=>void)|null}}}).__papaSpeech;state.current.onboundary?.({charIndex:Math.floor(state.current.text.length*.45)});});
  await page.waitForTimeout(350);
  await capture(page,testInfo,"tehiceesto-papa-release-10-voices-playing-390");

  await voiceControls.nth(0).click();
  await expect(voiceControls.nth(0)).toHaveAttribute("data-voice-state","paused");
  await page.waitForTimeout(250);
  await capture(page,testInfo,"tehiceesto-papa-release-11-voices-paused-390");
  await voiceControls.nth(0).click();
  await page.evaluate(()=>{const state=(window as unknown as {__papaSpeech:{current:{onend?:(()=>void)|null}}}).__papaSpeech;state.current.onend?.();});

  for(const i of [1,2]){
    await voiceControls.nth(i).click();
    await page.evaluate(()=>{const state=(window as unknown as {__papaSpeech:{current:{onend?:(()=>void)|null}}}).__papaSpeech;state.current.onend?.();});
  }
  await expect(page.locator(".thi-papa-voice-final-cta")).toBeEnabled();
  await capture(page,testInfo,"tehiceesto-papa-release-12-voices-complete-390");
  await page.locator(".thi-papa-voice-final-cta").click();
  await page.waitForTimeout(850);

  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","letter");
  await capture(page,testInfo,"tehiceesto-papa-release-13-letter-closed-390");
  await page.locator('[data-action="open-letter"]').click();
  await page.waitForTimeout(850);
  await capture(page,testInfo,"tehiceesto-papa-release-14-letter-open-390");
  await page.locator(".thi-papa-letter [data-action='advance']").click();
  await page.waitForTimeout(650);
  await page.locator(".lookback-button").click();
  await page.locator(".scene-lookback .primary-action").click();
  await page.waitForTimeout(1200);

  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","finale");
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-papa-release-15-finale-390");
});
