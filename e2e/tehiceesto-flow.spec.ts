import { mkdirSync } from "node:fs";
import { expect,test,type Page } from "playwright/test";
const slugs=["pareja","cumpleanos","hijos","abuelos","aniversario","propuesta","mama","amistad"];
async function sceneName(page:Page){return page.locator("main.thi-experience").getAttribute("data-scene")}
async function waitForScene(page:Page,name:string){await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene",name)}
async function advanceOne(page:Page){
  const current=await sceneName(page);if(!current)throw new Error("missing_scene");
  if(current==="finale"||current==="proposal")return;
  await page.waitForTimeout(420);
  if((await sceneName(page))!==current)return;
  if(current==="intro")await page.locator('[data-action="advance"]').click();
  else if(current==="door"){await page.locator('[data-action="open-door"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="memories"){
    const mamaNext=page.locator(".thi-mama-memory-local-nav > button").last();
    if(await mamaNext.count()){
      while(!(await mamaNext.isDisabled()))await mamaNext.click();
      await page.locator(".thi-mama-memories-continue").click();
    }else await page.locator('[data-action="advance"]').click();
  }
  else if(current==="timeline"||current==="video")await page.locator('[data-action="advance"]').click();
  else if(current==="light"){await page.locator('[data-action="light-reveal"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="hold"){await page.locator('[data-action="hold"]').press("Enter");await page.locator('[data-action="advance"]').click()}
  else if(current==="stars"){const items=page.locator('[data-action="star"]');const count=await items.count();for(let i=0;i<count;i++)await items.nth(i).click();await page.locator('[data-action="advance"]').click()}
  else if(current==="scratch"){await page.locator('[data-action="scratch-fallback"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="letter"){await page.locator('[data-action="open-letter"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="candles"){await page.locator('[data-action="blow-fallback"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="balloons"){const items=page.locator('[data-action="balloon"]');await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator('[data-action="advance"]').click()}
  else if(current==="voices"){const mamaChoices=page.locator('[data-action="mama-voice-choice"]');if(await mamaChoices.count()){for(let i=0;i<3;i++){await page.locator('[data-action="mama-voice-choice"]').nth(i).click();await page.locator('[data-action="mama-voice-toggle"]').click();await page.locator('[data-action="mama-voice-back"]').click()}await page.locator('[data-action="advance"]').click()}else{const demo=page.locator('[data-action="demo-voice"]').first();if(await demo.count())await demo.click();else await page.locator('[data-action="real-audio"]').first().evaluate((el:HTMLAudioElement)=>el.dispatchEvent(new Event("play",{bubbles:true})));await page.locator('[data-action="advance"]').click()}}
  else if(current==="quiz"){await page.locator('[data-action="quiz-answer"]').nth(1).click();await page.locator('[data-action="advance"]').click()}
  else if(current==="vault"){await page.locator('[data-action="open-vault"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="capsule"){await page.locator('[data-action="open-capsule"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="origin"||current==="childhood")await page.locator(".scene .primary-action").click();
  else if(current==="archive"){await page.locator(".archive-folder").click();await page.locator(".scene .primary-action").click()}
  else if(current==="home"){const items=page.locator(".home-memory button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
  else if(current==="legacy"){await page.locator(".legacy-seal").click();await page.locator(".scene .primary-action").click()}
  else if(current==="rituals"){const items=page.locator(".ritual-grid button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
  else if(current==="chapters"){const items=page.locator(".chapter-stack button");await items.nth(0).click();await items.nth(1).click();await page.locator(".scene .primary-action").click()}
  else if(current==="future"){await page.locator(".future-card").click();await page.locator(".scene .primary-action").click()}
  else if(current==="reasons"){const items=page.locator(".reason-ledger button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
  else if(current==="certainty"){const items=page.locator(".certainty-lines button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
  else if(current==="threshold"){await page.locator(".threshold-hold").press("Enter");await page.locator(".threshold-continue").click()}
  else if(current==="care"){const premium=page.locator(".mama-care-file");if(await premium.count()){await premium.nth(0).click();await premium.nth(1).click();await premium.nth(2).click();await page.locator(".mama-care-continue").click()}else{const items=page.locator(".care-grid button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}}
  else if(current==="sacrifices"){const premium=page.locator(".mama-sacrifice-trigger");if(await premium.count()){await premium.nth(0).click();await premium.nth(1).click();await premium.nth(2).click();await premium.nth(3).click();await page.locator(".mama-sacrifice-continue").click()}else{const items=page.locator(".sacrifice-list button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}}
  else if(current==="return"){await page.locator(".return-key").click();await page.locator(".scene .primary-action").click()}
  else if(current==="lessons"){const premium=page.locator(".thi-papa-lesson-card");if(await premium.count()){for(let i=1;i<await premium.count();i++)await premium.nth(i).click();await page.locator(".thi-papa-lessons-cta").click()}else{const items=page.locator(".lesson-ledger button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}}
  else if(current==="presence"){const premium=page.locator(".thi-papa-presence-card");if(await premium.count()){for(let i=1;i<await premium.count();i++)await premium.nth(i).click();await page.locator(".thi-papa-presence-cta").click()}else{const items=page.locator(".presence-track button");await items.nth(0).click();await items.nth(1).click();await page.locator(".scene .primary-action").click()}}
  else if(current==="inheritance"){const premium=page.locator(".thi-papa-inheritance-card");if(await premium.count()){for(let i=1;i<await premium.count();i++)await premium.nth(i).click();await page.locator(".thi-papa-inheritance-cta").click()}else{const items=page.locator(".inheritance-board button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}}
  else if(current==="lookback"){await page.locator(".lookback-button").click();await page.locator(".scene .primary-action").click()}
  else if(current==="casefile"){await page.locator(".casefile-folder").click();await page.locator(".scene .primary-action").click()}
  else if(current==="insidejokes"){const items=page.locator(".joke-decoder button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
  else if(current==="incidents"){const items=page.locator(".incident-stack button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
  else if(current==="proof"){const items=page.locator(".proof-list button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
  else if(current==="pact"){const items=page.locator(".pact-paper>button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene>.primary-action").click()}
  else throw new Error(`cannot_advance_from_${current}`);
}
test("home v2 explains the product fast and makes recipient choice immediate",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto");

  await expect(page.locator(".thh-home-v2")).toBeVisible();
  await expect(page.getByRole("heading",{name:/Un regalo que la emociona/i})).toBeVisible();
  await expect(page.getByText(/Transformamos tus fotos, audios y mensajes/i)).toBeVisible();
  await expect(page.locator(".thh-v2-meta")).toContainText("Desde");
  await expect(page.locator(".thh-v2-trust-price strong")).toContainText("$");
  await expect(page.locator(".thh-v2-trust-chip")).toHaveCount(4);

  const chooser=page.locator(".thh-v2-chooser");
  await expect(chooser).toBeVisible();
  await expect(chooser.getByText("¿Para quién querés hacerlo?")).toBeVisible();
  await expect(page.locator(".thh-v2-recipient")).toHaveCount(6);
  await expect(page.getByRole("link",{name:"Ver experiencia para Mamá"})).toHaveAttribute("href","/tehiceesto/experiencias/mama");
  await expect(page.getByRole("link",{name:/Crear mi regalo/i})).toHaveAttribute("href","/tehiceesto/crear");

  await expect(page.locator(".floating-whatsapp--home")).toBeHidden();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await expect(page.getByRole("heading",{name:/No recibe solo un regalo/i})).toBeAttached();
  await expect(page.getByText("Nosotros hacemos la magia")).toBeAttached();
  await expect(page.locator(".thh-v2-price strong")).toContainText("$");
  await expect(page.getByRole("heading",{name:/No estás comprando una página/i})).toBeAttached();
  await expect(page.getByLabel("Pago seguro con Mercado Pago")).toContainText("Mercado Pago");
  await expect(page.getByRole("link",{name:/Quiero crear este regalo/i})).toHaveAttribute("href","/tehiceesto/crear");

  const trust=page.locator(".thh-trust-marquee");
  const scroller=page.locator(".thh-trust-scroller");
  await expect(trust).toBeAttached();
  await expect(trust.getByRole("heading",{name:/Cuidado en cada detalle/i})).toBeAttached();
  await expect(trust).toContainText("Mercado Pago");
  await expect(page.locator(".thh-trust-card")).toHaveCount(12);
  expect(await scroller.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
  const reduced=await page.evaluate(()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if(!reduced){
    await expect.poll(()=>scroller.evaluate(el=>el.scrollLeft),{timeout:3000}).toBeGreaterThan(0);
  }
});

for(const slug of slugs)test(`Te Hice Esto demo ${slug} completes without getting stuck`,async({page})=>{test.setTimeout(45_000);await page.setViewportSize({width:390,height:844});await page.goto(`/tehiceesto/experiencias/${slug}`);await waitForScene(page,"intro");for(let step=0;step<20;step++){const current=await sceneName(page);if(current==="finale"||current==="proposal")break;const before=current;await advanceOne(page);await expect.poll(()=>sceneName(page),{timeout:4000,message:`${slug} did not advance from scene ${before}`}).not.toBe(before)}expect(["finale","proposal"],`${slug} never reached an ending`).toContain(await sceneName(page))});

test("every Te Hice Esto experience has a consistent back control after the cover",async({page})=>{
  test.setTimeout(90_000);
  await page.setViewportSize({width:390,height:844});
  for(const slug of [...slugs,"papa"]){
    await page.goto(`/tehiceesto/experiencias/${slug}`);
    await expect(page.locator(".thi-global-back-nav")).toHaveCount(0);
    await advanceOne(page);
    await expect(page.locator("main.thi-experience")).not.toHaveAttribute("data-scene","intro");
    const back=page.locator(".thi-global-back-nav");
    await expect(back,`back control missing for ${slug}`).toBeVisible();
    await back.click();
    await waitForScene(page,"intro");
    await expect(page.locator(".thi-global-back-nav")).toHaveCount(0);
  }
});

test("Papa premium keeps the emotional journey clean, audible and reset at the top",async({page})=>{
  test.setTimeout(60_000);
  await page.addInitScript(()=>{
    class FakeUtterance{
      text:string;lang="";rate=1;pitch=1;voice:null=null;
      onboundary:((event:{charIndex:number})=>void)|null=null;
      onend:(()=>void)|null=null;onerror:(()=>void)|null=null;
      constructor(text:string){this.text=text}
    }
    const state={current:null as FakeUtterance|null,calls:{speak:0,pause:0,resume:0,cancel:0}};
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:FakeUtterance});
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
      getVoices:()=>[],
      speak:(utterance:FakeUtterance)=>{state.current=utterance;state.calls.speak+=1},
      pause:()=>{state.calls.pause+=1},
      resume:()=>{state.calls.resume+=1},
      cancel:()=>{state.calls.cancel+=1},
    }});
    (window as unknown as {__papaSpeech:typeof state}).__papaSpeech=state;
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/papa");

  await expect(page.getByText("Pa, te hicimos algo")).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-global-back-nav")).toHaveCount(0);

  await advanceOne(page);
  await waitForScene(page,"memories");
  await expect(page.locator(".thi-papa-memory-card")).toHaveCount(3);
  await expect(page.locator(".thi-papa-memory-copy small").first()).toContainText("01");
  await expect(page.getByRole("button",{name:/Seguir\. Hay más/i})).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeVisible();
  const papaMemoriesBackground=await page.locator("main.thi-experience").evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(papaMemoriesBackground).not.toBe("none");

  await page.locator('[data-action="advance"]').click();
  await waitForScene(page,"lessons");
  await expect(page.getByText(/Resulta que sí te estábamos mirando/i)).toBeVisible();
  await expect(page.getByText(/Aunque hiciéramos cara de que no/i)).toBeVisible();
  const lessonItems=page.locator(".thi-papa-lesson-card");
  await expect(lessonItems).toHaveCount(4);
  await expect(lessonItems.nth(0)).toHaveClass(/open/);
  for(const i of [1,2,3]) await lessonItems.nth(i).click();
  await expect(page.getByText(/te estábamos mirando todo el tiempo/i)).toBeVisible();
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.locator(".thi-papa-lessons-cta").click();
  await waitForScene(page,"presence");
  await expect.poll(()=>page.evaluate(()=>window.scrollY),{timeout:1500}).toBeLessThan(12);

  await expect(page.getByText(/A veces no decías nada\. Pero estabas/i)).toBeVisible();
  await expect(page.getByText(/de grandes, pesa distinto/i)).toBeVisible();
  const presence=page.locator(".thi-papa-presence-card");
  await expect(presence).toHaveCount(3);
  await expect(presence.nth(0)).toHaveClass(/open/);
  await expect(page.locator(".thi-papa-presence-cta")).toBeDisabled();
  await presence.nth(1).click();await presence.nth(2).click();
  await expect(page.getByText(/todas las otras formas en que lo decías/i)).toBeVisible();
  await expect(page.locator(".thi-papa-presence-cta")).toBeEnabled();
  await page.locator(".thi-papa-presence-cta").click();
  await waitForScene(page,"inheritance");
  await expect(page.getByText(/Empezamos a encontrarte en nosotros/i)).toBeVisible();
  await expect(page.getByText(/juramos que nunca íbamos a repetir/i)).toBeVisible();
  const inheritance=page.locator(".thi-papa-inheritance-card");
  await expect(inheritance).toHaveCount(4);
  await expect(inheritance.nth(0)).toHaveClass(/open/);
  for(const i of [1,2,3]) await inheritance.nth(i).click();
  await expect(page.getByText(/una parte de crecer es esta/i)).toBeVisible();
  await expect(page.getByText(/un pedacito de la tuya/i)).toBeVisible();
  await page.locator(".thi-papa-inheritance-cta").click();

  await waitForScene(page,"voices");
  await expect(page.getByText(/mejor te las decimos/i)).toBeVisible();
  await expect(page.getByText(/Sin discurso\. Sin frase perfecta/i)).toBeVisible();
  await expect(page.getByText(/prometemos no hacer comentarios/i)).toBeVisible();
  const voiceControls=page.locator(".thi-papa-voice-control");
  await expect(voiceControls).toHaveCount(3);
  const voiceCta=page.locator(".thi-papa-voice-final-cta");
  await expect(voiceCta).toBeEnabled();
  await expect(page.locator(".thi-global-back-nav")).toBeVisible();

  // Audio is optional: the recipient can continue without listening to all—or any—messages.
  await voiceCta.click();
  await waitForScene(page,"letter");
  await page.locator(".thi-global-back-nav").click();
  await waitForScene(page,"voices");
  await expect(voiceCta).toBeEnabled();

  // Going back preserves the already-completed previous chapter instead of resetting it.
  await page.locator(".thi-global-back-nav").click();
  await waitForScene(page,"inheritance");
  await expect(page.locator(".thi-papa-inheritance-card.open")).toHaveCount(4);
  await expect(page.getByText(/una parte de crecer es esta/i)).toBeVisible();
  await page.locator(".thi-papa-inheritance-cta").click();
  await waitForScene(page,"voices");

  const first=voiceControls.nth(0);
  await first.click();
  await expect(first).toHaveAttribute("data-voice-state","playing");
  await expect(page.locator(".thi-papa-voice-card-v2").nth(0)).toHaveClass(/is-playing/);
  await first.click();
  await expect(first).toHaveAttribute("data-voice-state","paused");
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__papaSpeech:{calls:{pause:number}}}).__papaSpeech.calls.pause)).toBe(1);
  await first.click();
  await expect(first).toHaveAttribute("data-voice-state","playing");
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__papaSpeech:{calls:{resume:number}}}).__papaSpeech.calls.resume)).toBe(1);
  await page.evaluate(()=>{const state=(window as unknown as {__papaSpeech:{current:{text:string;onboundary?:((event:{charIndex:number})=>void)|null;onend?:(()=>void)|null}}}).__papaSpeech;state.current.onboundary?.({charIndex:Math.floor(state.current.text.length*.55)});});
  await expect(page.locator(".thi-papa-voice-wave-v2").nth(0).locator("b.done")).not.toHaveCount(0);
  await expect(first).not.toHaveAttribute("data-voice-state","completed");
  await page.evaluate(()=>{const state=(window as unknown as {__papaSpeech:{current:{onend?:(()=>void)|null}}}).__papaSpeech;state.current.onend?.();});
  await expect(first).toHaveAttribute("data-voice-state","completed");

  for(const i of [1,2]){
    const control=voiceControls.nth(i);
    await control.click();
    await expect(control).toHaveAttribute("data-voice-state","playing");
    await page.evaluate(()=>{const state=(window as unknown as {__papaSpeech:{current:{onend?:(()=>void)|null}}}).__papaSpeech;state.current.onend?.();});
    await expect(control).toHaveAttribute("data-voice-state","completed");
  }

  await expect(page.getByText(/No hace falta que respondas nada ahora/i)).toBeVisible();
  await expect(page.getByText(/aunque hayamos tardado bastante/i)).toBeVisible();
  await expect(voiceCta).toBeEnabled();
  await voiceCta.click();

  await waitForScene(page,"letter");
  const paper=page.locator(".thi-papa-letter .thi-envelope .paper");
  await expect.poll(()=>paper.evaluate(el=>Number.parseFloat(getComputedStyle(el).opacity))).toBeLessThan(.05);
  await page.locator('[data-action="open-letter"]').click();
  await expect.poll(()=>paper.evaluate(el=>Number.parseFloat(getComputedStyle(el).opacity))).toBeGreaterThan(.9);
  await expect(page.getByText(/Nosotros tampoco te lo hicimos fácil/i)).toBeVisible();
  await expect(page.getByText(/Te queremos, Pa/i)).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await page.locator(".thi-papa-letter [data-action='advance']").click();

  await waitForScene(page,"lookback");
  await expect(page.getByText(/dejás de mirar a tu papá sólo como/i)).toBeVisible();
  await page.locator(".lookback-button").click();
  await expect(page.getByText(/también estaba aprendiendo/i)).toBeVisible();
  await page.locator(".scene-lookback .primary-action").click();
  await waitForScene(page,"finale");
  await expect(page.locator(".thi-papa-finale")).toBeVisible();
  await expect(page.getByText(/aprendimos bastante más de vos/i)).toBeVisible();
  await expect.poll(()=>page.locator(".floating-whatsapp--experience").evaluate(el=>getComputedStyle(el).visibility)).toBe("visible");

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
test("scene state resets when revisiting and restart always starts clean",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/tehiceesto/experiencias/cumpleanos");await advanceOne(page);await waitForScene(page,"candles");await page.locator('[data-action="blow-fallback"]').click();await page.locator('[data-action="advance"]').click();await waitForScene(page,"balloons");const balloons=page.locator('[data-action="balloon"]');await balloons.nth(0).click();await expect(balloons.nth(0)).toHaveClass(/pop/);await page.locator('.thi-progress-premium [data-action="previous"]').click();await waitForScene(page,"candles");await expect(page.locator(".thi-birthday-ritual")).not.toHaveClass(/out/);await page.locator('[data-action="blow-fallback"]').click();await page.locator('[data-action="advance"]').click();await waitForScene(page,"balloons");await expect(page.locator(".thi-balloons button.pop")).toHaveCount(0);await balloons.nth(0).click();await balloons.nth(1).click();await page.locator('.thi-reset-journey[data-action="restart"]').click();await waitForScene(page,"intro")});
test("all visible scene copy can be overridden without changing the engine",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/tehiceesto/experiencias/pareja");await expect(page.getByText(/armó esto pensando en vos/i)).toBeVisible();await page.locator('[data-action="advance"]').click();await expect(page.getByText(/No todo empieza con una fecha/i)).toBeVisible()});
test("pareja includes an intimate voice-note scene before the light reveal",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/tehiceesto/experiencias/pareja");await waitForScene(page,"intro");await advanceOne(page);await waitForScene(page,"door");await advanceOne(page);await waitForScene(page,"memories");await advanceOne(page);await waitForScene(page,"voices");await page.locator('[data-action="demo-voice"]').click();await expect(page.getByText(/desde que estás vos/i)).toBeVisible();await expect(page.locator('[data-action="advance"]')).toBeEnabled()});


test("mama childhood is a premium editorial album without sales interruption",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/mama");
  await waitForScene(page,"intro");
  await page.getByRole("button",{name:/Abrir esto/i}).click();
  await waitForScene(page,"childhood");

  await expect(page.getByText("Volver un segundo atrás",{exact:false})).toBeVisible();
  await expect(page.getByRole("heading",{name:/Hubo un tiempo en que el mundo era enorme/i})).toBeVisible();
  await expect(page.locator(".childhood-memory")).toBeVisible();
  await expect(page.locator(".childhood-photo")).toBeVisible();
  await expect(page.getByText("De chicos no veíamos todo.")).toBeVisible();
  await expect(page.locator(".childhood-note p")).toHaveCount(2);

  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeVisible();

  const cta=page.getByRole("button",{name:/Seguir recordando/i});
  await expect(cta).toBeVisible();

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await cta.click();
  await waitForScene(page,"memories");
});


test("mama memories use a focused editorial photo deck and reveal CTA at the end",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/mama");
  await waitForScene(page,"intro");
  await page.getByRole("button",{name:/Abrir esto/i}).click();
  await waitForScene(page,"childhood");
  await page.getByRole("button",{name:/Seguir recordando/i}).click();
  await waitForScene(page,"memories");

  await expect(page.locator(".thi-mama-memories")).toBeVisible();
  await expect(page.getByRole("heading",{name:/Algunos momentos terminan/i})).toBeVisible();
  await expect(page.locator(".thi-mama-memory-card")).toHaveCount(3);
  await expect(page.locator(".thi-mama-memory-card.is-active")).toHaveCount(1);
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeHidden();
  await expect(page.getByRole("button",{name:/Seguir con la historia/i})).toHaveCount(0);

  const deck=page.locator(".thi-mama-memory-deck");
  await expect(deck).toHaveCSS("touch-action","pan-y");
  const box=await deck.boundingBox();
  if(!box)throw new Error("mama memory deck has no bounding box");
  const swipeLeft=async(pointerId:number)=>{
    const y=box.y+Math.min(box.height*.42,260);
    const startX=box.x+box.width*.78;
    const endX=box.x+box.width*.24;
    await deck.dispatchEvent("pointerdown",{pointerId,pointerType:"touch",isPrimary:true,clientX:startX,clientY:y,buttons:1});
    await deck.dispatchEvent("pointermove",{pointerId,pointerType:"touch",isPrimary:true,clientX:(startX+endX)/2,clientY:y+2,buttons:1});
    await deck.dispatchEvent("pointerup",{pointerId,pointerType:"touch",isPrimary:true,clientX:endX,clientY:y+2,buttons:0});
  };
  await swipeLeft(31);
  await expect(deck).toHaveAttribute("data-active","1");
  await swipeLeft(32);
  await expect(deck).toHaveAttribute("data-active","2");

  const continueButton=page.getByRole("button",{name:/Seguir con la historia/i});
  await expect(continueButton).toBeVisible();

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await continueButton.click();
  await waitForScene(page,"care");
});


test("mama care reveals a premium invisible-care archive before continuing",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/mama");
  await waitForScene(page,"intro");
  await page.getByRole("button",{name:/Abrir esto/i}).click();
  await waitForScene(page,"childhood");
  await page.getByRole("button",{name:/Seguir recordando/i}).click();
  await waitForScene(page,"memories");

  const memoryNext=page.locator(".thi-mama-memory-local-nav > button").last();
  await memoryNext.click();
  await memoryNext.click();
  await page.getByRole("button",{name:/Seguir con la historia/i}).click();
  await waitForScene(page,"care");

  await expect(page.locator(".scene-care-mama")).toBeVisible();
  await expect(page.locator(".mama-care-file")).toHaveCount(3);
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeHidden();
  await expect(page.locator(".mama-care-continue")).toHaveCount(0);

  const cards=page.locator(".mama-care-file");
  for(let i=0;i<3;i++){
    await cards.nth(i).click();
    await expect(cards.nth(i)).toHaveClass(/open/);
    await expect(cards.nth(i)).toHaveAttribute("aria-expanded","true");
  }

  await expect(page.locator(".scene-care-mama")).toHaveClass(/care-open-3/);
  await expect(page.getByText("Hoy vemos todo lo que había detrás. Y también todo lo que construiste.")).toBeVisible();
  const next=page.getByRole("button",{name:/Seguir/i});
  await expect(next).toBeVisible();

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await next.click();
  await waitForScene(page,"sacrifices");
});


test("mama sacrifices reveal all four invisible costs before the final resolution",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/mama");
  await waitForScene(page,"intro");
  await page.getByRole("button",{name:/Abrir esto/i}).click();
  await waitForScene(page,"childhood");
  await page.getByRole("button",{name:/Seguir recordando/i}).click();
  await waitForScene(page,"memories");

  const memoryNext=page.locator(".thi-mama-memory-local-nav > button").last();
  await memoryNext.click();
  await memoryNext.click();
  await page.getByRole("button",{name:/Seguir con la historia/i}).click();
  await waitForScene(page,"care");

  const care=page.locator(".mama-care-file");
  for(let i=0;i<3;i++)await care.nth(i).click();
  await page.getByRole("button",{name:/Seguir/i}).click();
  await waitForScene(page,"sacrifices");

  await expect(page.locator(".scene-sacrifices-mama")).toBeVisible();
  await expect(page.locator(".mama-sacrifice-entry")).toHaveCount(4);
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeHidden();
  await expect(page.locator(".mama-sacrifice-continue")).toHaveCount(0);

  const entries=page.locator(".mama-sacrifice-entry");
  for(let i=0;i<4;i++){
    await entries.nth(i).locator(".mama-sacrifice-trigger").click();
    await expect(entries.nth(i)).toHaveClass(/open/);
    await expect(entries.nth(i).locator(".mama-sacrifice-trigger")).toHaveAttribute("aria-expanded","true");
  }

  await expect(page.locator(".scene-sacrifices-mama")).toHaveClass(/sacrifices-open-4/);
  await expect(page.getByText("Y también estabas vos.")).toBeVisible();
  await expect(page.getByText(/Nunca fue “simplemente ser mamá”/)).toBeVisible();

  const next=page.getByRole("button",{name:/Seguir/i});
  await expect(next).toBeVisible();

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await next.click();
  await waitForScene(page,"voices");
});


test("mama voices are a premium listening room with resilient playback and three-message completion",async({page})=>{
  await page.addInitScript(()=>{
    class FakeUtterance{
      text:string;
      lang="";
      rate=1;
      pitch=1;
      voice:null=null;
      onend:(()=>void)|null=null;
      onerror:(()=>void)|null=null;
      constructor(text:string){this.text=text}
    }
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:FakeUtterance});
    Object.defineProperty(window,"speechSynthesis",{
      configurable:true,
      value:{
        getVoices:()=>[],
        speak:()=>{},
        pause:()=>{},
        resume:()=>{},
        cancel:()=>{},
      },
    });
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/mama");
  await waitForScene(page,"intro");
  await page.getByRole("button",{name:/Abrir esto/i}).click();
  await waitForScene(page,"childhood");
  await page.getByRole("button",{name:/Seguir recordando/i}).click();
  await waitForScene(page,"memories");

  const memoryNext=page.locator(".thi-mama-memory-local-nav > button").last();
  await memoryNext.click();
  await memoryNext.click();
  await page.getByRole("button",{name:/Seguir con la historia/i}).click();
  await waitForScene(page,"care");

  const care=page.locator(".mama-care-file");
  for(let i=0;i<3;i++)await care.nth(i).click();
  await page.getByRole("button",{name:/Seguir/i}).click();
  await waitForScene(page,"sacrifices");

  const sacrifices=page.locator(".mama-sacrifice-trigger");
  for(let i=0;i<4;i++)await sacrifices.nth(i).click();
  await page.getByRole("button",{name:/Seguir/i}).click();
  await waitForScene(page,"voices");

  await expect(page.locator(".thi-mama-voice-picker")).toBeVisible();
  await expect(page.locator(".mama-voice-choice")).toHaveCount(0);
  await expect(page.locator('[data-action="mama-voice-choice"]')).toHaveCount(3);
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeHidden();

  await page.locator('[data-action="mama-voice-choice"]').nth(0).click();
  await expect(page.locator(".thi-mama-voice-player")).toBeVisible();

  const toggle=page.locator('[data-action="mama-voice-toggle"]');
  await toggle.click();
  await expect(toggle).toHaveAttribute("data-voice-state",/playing|played/);
  if(await toggle.getAttribute("data-voice-state")==="playing"){
    await toggle.click();
    await expect(toggle).toHaveAttribute("data-voice-state",/paused|played/);
    if(await toggle.getAttribute("data-voice-state")==="paused"){
      await toggle.click();
      await expect(toggle).toHaveAttribute("data-voice-state",/playing|played/);
    }
  }

  await page.locator('[data-action="mama-voice-back"]').click();
  await page.locator('[data-action="mama-voice-choice"]').nth(1).click();
  await page.locator('[data-action="mama-voice-toggle"]').click();
  await page.locator('[data-action="mama-voice-back"]').click();
  await page.locator('[data-action="mama-voice-choice"]').nth(2).click();
  await page.locator('[data-action="mama-voice-toggle"]').click();
  await page.locator('[data-action="mama-voice-back"]').click();

  await expect(page.locator(".thi-mama-voices-complete")).toBeVisible();
  await expect(page.getByText(/Tres voces\./)).toBeVisible();
  await expect(page.getByText(/Una misma certeza/)).toBeVisible();
  const next=page.getByRole("button",{name:/Seguir/i});
  await expect(next).toBeVisible();

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await next.click();
  await waitForScene(page,"letter");

  await expect(page.getByText("Hay palabras que merecían llegar hasta acá")).toBeVisible();
  await expect(page.getByRole("heading",{name:/Después de entender tantas cosas/i})).toBeVisible();
  await page.locator('[data-action="open-letter"]').click();
  await expect(page.getByText(/Mucho de lo bueno que hay en nosotros empezó con vos/)).toBeVisible();

  const mamaPaper=page.locator(".thi-mama-letter .thi-envelope.open .paper");
  await expect(mamaPaper).toBeVisible();
  const paperFit=await mamaPaper.evaluate(el=>({
    clientHeight:el.clientHeight,
    scrollHeight:el.scrollHeight,
    clientWidth:el.clientWidth,
    scrollWidth:el.scrollWidth,
  }));
  expect(paperFit.scrollHeight).toBeLessThanOrEqual(paperFit.clientHeight+1);
  expect(paperFit.scrollWidth).toBeLessThanOrEqual(paperFit.clientWidth+1);
  await expect(mamaPaper.locator("em")).toBeVisible();

  await page.getByRole("button",{name:/Guardar estas palabras/i}).click();
  await waitForScene(page,"finale");

  await expect(page.locator(".thi-mama-finale")).toBeVisible();
  await expect(page.getByText("Por si alguna vez dudás")).toBeVisible();
  await expect(page.getByRole("heading",{name:/Gracias por ser hogar mucho antes/i})).toBeVisible();
  await expect(page.getByText(/Mirá todo lo que construiste/)).toBeVisible();
});


test("mama intro is premium, story-first and has no headphone prompt",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/mama");
  await waitForScene(page,"intro");

  await expect(page.locator(".thi-mama-intro")).toBeVisible();
  await expect(page.getByText("Tus hijos hicieron algo para vos",{exact:false})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Mamá"})).toBeVisible();
  await expect(page.getByText(/Hay una edad en la que uno cree que mamá puede con todo/i)).toBeVisible();
  await expect(page.getByText(/Mejor con auriculares/i)).toHaveCount(0);

  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeHidden();
  await expect(page.locator(".thi-reset-journey")).toBeHidden();
  await expect(page.locator(".thi-scene-meta")).toBeHidden();

  const open=page.getByRole("button",{name:/Abrir esto/i});
  await expect(open).toBeVisible();

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await open.click();
  await waitForScene(page,"childhood");
});


test("pair threshold door swings inward behind the jamb",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/pareja");
  await waitForScene(page,"intro");
  await page.locator('[data-action="advance"]').click();
  await waitForScene(page,"door");

  const leaf=page.locator(".thi-pair-threshold-leaf");
  const closedBox=await leaf.boundingBox();
  if(!closedBox)throw new Error("closed threshold door has no bounding box");

  await page.locator('[data-action="open-door"]').click();
  await expect(page.locator(".thi-pair-threshold")).toHaveClass(/is-open/);
  await page.waitForTimeout(1150);

  const openBox=await leaf.boundingBox();
  if(!openBox)throw new Error("open threshold door has no bounding box");
  expect(openBox.width).toBeLessThan(closedBox.width*.58);

  const depth=await leaf.evaluate(el=>{
    const transform=getComputedStyle(el).transform;
    const matrix=new DOMMatrixReadOnly(transform);
    const frame=el.closest(".thi-pair-threshold-frame");
    return {
      z:matrix.m43,
      jambZ:frame?getComputedStyle(frame,"::after").zIndex:"",
    };
  });
  expect(depth.z).toBeLessThan(-70);
  expect(depth.jambZ).toBe("6");
});


test("pair finale is a clean premium epilogue with integrated conversion CTA",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/pareja");
  await waitForScene(page,"intro");
  while((await page.locator("main.thi-experience").getAttribute("data-scene"))!=="finale"){
    await advanceOne(page);
  }
  await waitForScene(page,"finale");

  await expect(page.locator(".thi-pair-finale")).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeHidden();
  await expect(page.locator(".thi-reset-journey")).toBeHidden();
  await expect(page.locator(".thi-scene-meta")).toBeHidden();

  const seal=page.locator(".thi-pair-finale-seal");
  await expect(seal).toBeVisible();
  await expect(seal.locator("strong")).not.toHaveText("");

  const reactions=page.locator(".thi-pair-finale-reactions button");
  await expect(reactions).toHaveCount(4);
  await reactions.first().click();
  await expect(reactions.first()).toHaveAttribute("aria-pressed","true");

  const create=page.locator('[data-action="create-story"]');
  await expect(create).toHaveAttribute("href","/tehiceesto/crear?experiencia=pareja");
  await page.waitForTimeout(3400);
  await expect(create).toBeVisible();

  const box=await create.boundingBox();
  if(!box)throw new Error("final create CTA has no bounding box");
  expect(box.y).toBeGreaterThan(0);
  expect(box.y+box.height).toBeLessThanOrEqual(844);

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});


test("pair letter scene opens as a premium physical keepsake without commercial chrome",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/pareja");
  await waitForScene(page,"intro");
  for(let step=0;step<16 && await sceneName(page)!=="letter";step++){
    const before=await sceneName(page);
    await advanceOne(page);
    await expect.poll(()=>sceneName(page),{timeout:5000}).not.toBe(before);
  }
  await waitForScene(page,"letter");

  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeHidden();
  await expect(page.locator(".thi-reset-journey")).toBeHidden();
  await expect(page.getByText("Tocá el sello")).toBeVisible();

  const envelope=page.locator('[data-action="open-letter"]');
  const paper=page.locator(".thi-envelope .paper");
  await expect(paper).toBeHidden();

  await envelope.click();
  await page.waitForTimeout(1450);

  await expect(envelope).toHaveClass(/open/);
  await expect(page.locator(".thi-pair-letter")).toHaveClass(/is-open/);
  await expect(paper).toBeVisible();
  await expect(page.locator(".thi-envelope .paper em")).toBeVisible();
  await expect(page.getByRole("button",{name:"Continuar →"})).toBeVisible();

  const signature=page.locator(".thi-envelope .paper em");
  const box=await signature.boundingBox();
  if(!box)throw new Error("letter signature has no bounding box");
  expect(box.y).toBeGreaterThan(0);
  expect(box.y+box.height).toBeLessThan(844);
});


test("pair hold scene is cinematic, distraction-free and responds while holding",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/pareja");
  await waitForScene(page,"intro");

  for(let step=0;step<16 && await sceneName(page)!=="hold";step++){
    const before=await sceneName(page);
    await advanceOne(page);
    await expect.poll(()=>sceneName(page),{timeout:5000}).not.toBe(before);
  }
  await waitForScene(page,"hold");

  const hold=page.locator('[data-action="hold"]');
  const ritual=page.locator(".thi-hold-reveal.cinematic");
  await expect(ritual).toBeVisible({timeout:15_000});
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeHidden();

  await expect(hold).toBeVisible();
  await hold.focus();
  await page.keyboard.press("Enter");
  await expect(ritual).toHaveClass(/revealed/);
  await expect(ritual).toHaveAttribute("data-hold-phase","complete");
  await expect(page.locator('[data-action="advance"]')).toBeVisible();
});


test("pair demo voice can pause and resume without restarting",async({page})=>{
  await page.addInitScript(()=>{
    const calls={speak:0,pause:0,resume:0,cancel:0};
    class FakeUtterance{
      text:string;
      lang="";
      rate=1;
      pitch=1;
      voice:null=null;
      onend:(()=>void)|null=null;
      onerror:(()=>void)|null=null;
      constructor(text:string){this.text=text}
    }
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:FakeUtterance});
    Object.defineProperty(window,"speechSynthesis",{
      configurable:true,
      value:{
        getVoices:()=>[],
        speak:()=>{calls.speak+=1},
        pause:()=>{calls.pause+=1},
        resume:()=>{calls.resume+=1},
        cancel:()=>{calls.cancel+=1},
      },
    });
    (window as unknown as {__speechCalls:typeof calls}).__speechCalls=calls;
  });

  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/pareja");
  await waitForScene(page,"intro");
  await advanceOne(page);
  await waitForScene(page,"door");
  await advanceOne(page);
  await waitForScene(page,"memories");
  await advanceOne(page);
  await waitForScene(page,"voices");

  const voice=page.locator('[data-action="demo-voice"]').first();
  await voice.click();
  await expect(voice).toHaveAttribute("aria-label","Pausar audio");
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speechCalls:{speak:number}}).__speechCalls.speak)).toBe(1);

  await voice.click();
  await expect(voice).toHaveAttribute("aria-label","Continuar audio");
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speechCalls:{pause:number}}).__speechCalls.pause)).toBe(1);

  await voice.click();
  await expect(voice).toHaveAttribute("aria-label","Pausar audio");
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speechCalls:{resume:number}}).__speechCalls.resume)).toBe(1);
});


test("pair scratch card reveals from real drag gestures without fallback",async({page})=>{
  test.setTimeout(60_000);
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/pareja");
  await waitForScene(page,"intro");

  for(let step=0;step<12;step++){
    const current=await sceneName(page);
    if(current==="scratch")break;
    const before=current;
    await advanceOne(page);
    await expect.poll(()=>sceneName(page),{timeout:5000}).not.toBe(before);
  }

  await waitForScene(page,"scratch");
  await expect(page.locator('[data-action="scratch-canvas"]')).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();

  const canvas=page.locator('[data-action="scratch-canvas"]');
  const box=await canvas.boundingBox();
  expect(box).not.toBeNull();
  if(!box)throw new Error("scratch_canvas_missing_box");

  const left=box.x+28;
  const right=box.x+box.width-28;
  const top=box.y+38;
  const bottom=box.y+box.height-38;
  const pointerId=19;
  const rows=8;

  await canvas.dispatchEvent("pointerdown",{pointerId,pointerType:"mouse",isPrimary:true,clientX:left,clientY:top,buttons:1});
  outer: for(let row=0;row<rows;row++){
    if(await canvas.count()===0)break;
    const y=top+row*((bottom-top)/(rows-1));
    const fromX=row%2===0?left:right;
    const toX=row%2===0?right:left;
    for(let step=0;step<=20;step++){
      if(await canvas.count()===0)break outer;
      const t=step/20;
      await canvas.dispatchEvent("pointermove",{pointerId,pointerType:"mouse",isPrimary:true,clientX:fromX+(toX-fromX)*t,clientY:y,buttons:1});
    }
  }
  if(await canvas.count())await canvas.dispatchEvent("pointerup",{pointerId,pointerType:"mouse",isPrimary:true,clientX:right,clientY:bottom,buttons:0});

  await expect(page.locator('[data-action="scratch-canvas"]')).toHaveCount(0);
  await expect(page.getByRole("button",{name:/Acepto el trato/i})).toBeVisible();
  await expect(page.locator('[data-action="scratch-fallback"]')).toHaveCount(0);
});


test("pair scratch card reveals from touch pointer gestures on mobile",async({page})=>{
  test.setTimeout(60_000);
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/pareja");
  await waitForScene(page,"intro");

  for(let step=0;step<12;step++){
    const current=await sceneName(page);
    if(current==="scratch")break;
    const before=current;
    await advanceOne(page);
    await expect.poll(()=>sceneName(page),{timeout:5000}).not.toBe(before);
  }

  await waitForScene(page,"scratch");
  const canvas=page.locator('[data-action="scratch-canvas"]');
  await expect(canvas).toBeVisible();

  const box=await canvas.boundingBox();
  expect(box).not.toBeNull();
  if(!box)throw new Error("scratch_touch_canvas_missing_box");

  const left=box.x+28;
  const right=box.x+box.width-28;
  const top=box.y+38;
  const bottom=box.y+box.height-38;
  const pointerId=17;
  const rows=6;

  await canvas.dispatchEvent("pointerdown",{
    pointerId,pointerType:"touch",isPrimary:true,buttons:1,
    clientX:left,clientY:top,
  });

  for(let row=0;row<rows;row++){
    const y=top+row*((bottom-top)/(rows-1));
    const fromX=row%2===0?left:right;
    const toX=row%2===0?right:left;
    const segments=20;
    for(let segment=0;segment<=segments;segment++){
      const x=fromX+(toX-fromX)*(segment/segments);
      await canvas.dispatchEvent("pointermove",{
        pointerId,pointerType:"touch",isPrimary:true,buttons:1,
        clientX:x,clientY:y,
      });
      if(await canvas.count()===0)break;
    }
    if(await canvas.count()===0)break;
  }

  if(await canvas.count()){
    await canvas.dispatchEvent("pointerup",{
      pointerId,pointerType:"touch",isPrimary:true,buttons:0,
      clientX:right,clientY:bottom,
    });
  }

  await expect(canvas).toHaveCount(0);
  await expect(page.getByRole("button",{name:/Acepto el trato/i})).toBeVisible();
  await expect(page.locator('[data-action="scratch-fallback"]')).toHaveCount(0);
});


test("premium haptics fire on tactile interactions",async({page})=>{
  await page.addInitScript(()=>{
    (window as unknown as {__thiVibrations:(number|number[])[]}).__thiVibrations=[];
    Object.defineProperty(navigator,"vibrate",{
      configurable:true,
      value:(pattern:number|number[])=>{
        (window as unknown as {__thiVibrations:(number|number[])[]}).__thiVibrations.push(pattern);
        return true;
      },
    });
  });

  const vibrations=()=>page.evaluate(()=>(window as unknown as {__thiVibrations:(number|number[])[]}).__thiVibrations);

  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/pareja");
  await page.locator('[data-action="advance"]').click();
  await waitForScene(page,"door");
  await page.locator('[data-action="open-door"]').click();
  await expect.poll(async()=>JSON.stringify(await vibrations())).toContain(JSON.stringify([12,35,9]));

  await page.goto("/tehiceesto/experiencias/cumpleanos");
  await page.locator('[data-action="advance"]').click();
  await waitForScene(page,"candles");
  await page.locator('[data-action="blow-fallback"]').click();
  await expect.poll(async()=>JSON.stringify(await vibrations())).toContain(JSON.stringify([10,20,10]));
  await page.locator('[data-action="advance"]').click();
  await waitForScene(page,"balloons");
  await page.locator('[data-action="balloon"]').first().click();
  await expect.poll(async()=>JSON.stringify(await vibrations())).toContain("10");

  await page.goto("/tehiceesto/experiencias/mama");
  await waitForScene(page,"intro");
  for(let step=0;step<6;step++){
    const current=await sceneName(page);
    if(current==="care")break;
    await advanceOne(page);
    await expect.poll(()=>sceneName(page),{timeout:4000}).not.toBe(current);
  }
  await waitForScene(page,"care");
  await page.locator('[data-action="care-open"]').first().click();
  await expect.poll(async()=>JSON.stringify(await vibrations())).toContain("7");
});


test("preselected experience skips the chooser and keeps the purchase obvious",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/crear?experiencia=pareja");
  await expect(page.getByRole("heading",{name:/Tres datos y listo/i})).toBeVisible();
  await expect(page.getByText("Nuestra historia",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:/Elegir para mi pareja/i})).toHaveCount(0);
  await expect(page.getByRole("button",{name:/Revisar y pagar/i})).toBeEnabled();
});

test("self-serve purchase chooses an experience, captures contact and opens checkout",async({page})=>{
  test.setTimeout(45_000);
  const code="1234567890abcdef12";
  const editorToken="a".repeat(64);

  await page.route("**/functions/v1/order-create",async route=>{
    const request=route.request();
    const body=JSON.parse(request.postData()||"{}") as Record<string,unknown>;
    expect(body.experienceSlug).toBe("pareja");
    expect(body.customerName).toBe("Mauro");
    expect(body.email).toBe("mauro@example.com");
    expect(String(body.whatsapp)).toContain("549221");
    expect(body.consent).toBe(true);
    expect(body.affiliateToken).toBe("affiliate-token-test-12345678901234567890");
    return route.fulfill({
      status:200,
      contentType:"application/json",
      headers:{"access-control-allow-origin":"*"},
      body:JSON.stringify({
        code,
        priceMinor:2500000,
        currency:"ARS",
        checkoutUrl:"https://checkout.test/tehiceesto",
        checkoutReady:true,
        editorToken,
      }),
    });
  });

  await page.route("https://checkout.test/**",route=>
    route.fulfill({status:200,contentType:"text/html",body:"<html><body>checkout</body></html>"})
  );

  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/crear");
  await page.evaluate(()=>{document.cookie="thi_affiliate_token=affiliate-token-test-12345678901234567890; path=/; SameSite=Lax"});
  await page.getByRole("button",{name:/Elegir para mi pareja/i}).click();

  await page.getByPlaceholder("Ej. Mauro").fill("Mauro");
  await page.getByPlaceholder("Ej. 2215653163").fill("5492215551234");
  await page.getByPlaceholder("tu@email.com").fill("mauro@example.com");
  await page.locator('.order-consent input[type="checkbox"]').check();
  await page.getByRole("button",{name:/Revisar y pagar/i}).click();

  await expect(page.getByRole("heading",{name:/Pagás\. Y empezás a crear/i})).toBeVisible();
  await page.getByRole("button",{name:/Pagar con Mercado Pago/i}).click();
  await page.waitForURL(/checkout\.test/);
  await page.goto("/tehiceesto/crear");
  await expect.poll(()=>page.evaluate(key=>window.localStorage.getItem(key),`thi_editor_access:${code}`)).toBe(editorToken);
});


test("customer studio gives a zero-tech user one obvious action at a time",async({page})=>{
  const code="fedcba0987654321ab";
  const editorToken="d".repeat(64);

  await page.addInitScript(({key,token})=>localStorage.setItem(key,token),{
    key:`thi_editor_access:${code}`,token:editorToken,
  });

  await page.route("**/functions/v1/creator-api",async route=>{
    const body=JSON.parse(route.request().postData()||"{}") as Record<string,unknown>;
    if(body.action==="openStudio"){
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({
        gift:{
          public_code:code,status:"paid",template_version:"live",experience_slug:"pareja",
          giver_name:"Mauro",recipient_name:"A definir",occasion:null,feeling:"Emoción",
          opening_text:null,letter_text:null,closing_text:null,music_url:null,
          scene_recipe:["intro","door","memories","voices","light","stars","scratch","hold","letter","finale"],
          story_data:{relationship:"",keyDate:"",anecdote:"",sceneContent:{}},theme_data:{},published_at:null,
        },
        order:{status:"approved",amount_minor:2500000,currency:"ARS"},
        media:[],
      })});
    }
    return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true})});
  });

  await page.setViewportSize({width:390,height:844});
  await page.goto(`/tehiceesto/editar/${code}`);

  await expect(page.getByText(/PASO 1 DE 6 · PERSONAS/i)).toBeVisible();
  await page.getByRole("button",{name:/Continuar/i}).click();
  await expect(page.getByText(/Primero escribí el nombre/i)).toBeVisible();
  await expect(page.getByRole("heading",{name:/¿Quién va a recibir esto/i})).toBeVisible();

  await page.getByPlaceholder("Ej. Ailín").fill("Ailín");
  await page.getByRole("button",{name:/Continuar/i}).click();
  await expect(page.getByText(/PASO 2 DE 6 · FOTOS/i)).toBeVisible();
  await expect(page.getByRole("button",{name:/Elegir fotos/i})).toBeVisible();
  await expect(page.getByRole("button",{name:/Elegir foto para la linterna/i})).toBeVisible();

  await page.getByRole("button",{name:/Continuar/i}).click();
  await expect(page.getByText(/PASO 3 DE 6 · AUDIOS/i)).toBeVisible();
  await expect(page.getByText(/Los audios son opcionales/i)).toBeVisible();
  await expect(page.getByRole("button",{name:/Grabar ahora/i})).toBeVisible();
  await expect(page.getByText(/No mostramos voces de ejemplo/i)).toBeVisible();

  await page.getByRole("button",{name:/Continuar/i}).click();
  await expect(page.getByText(/PASO 4 DE 6 · PALABRAS/i)).toBeVisible();
  await expect(page.locator(".studio-field.important textarea")).toBeVisible();
  await expect(page.getByText("La primera frase",{exact:true})).toBeHidden();
  await expect(page.getByRole("button",{name:/No sé qué escribir/i})).toBeVisible();
  await expect(page.getByText("LA RASPADITA",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:/una cita sorpresa sin celulares/i})).toBeVisible();

  await page.getByRole("button",{name:/Continuar/i}).click();
  await expect(page.getByText(/PASO 5 DE 6 · OPCIONAL/i)).toBeVisible();
  await expect(page.getByRole("heading",{name:/Tu regalo ya viene armado/i})).toBeVisible();
  await expect(page.locator(".studio-section-list")).toBeHidden();
  await expect(page.getByRole("button",{name:/Ver mi regalo/i})).toBeVisible();

  expect(await page.getByText(/metadata|scene_recipe|storage_path|template_version/i).count()).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("customer studio is guided, mobile-safe and publishes without technical language",async({page},testInfo)=>{
  test.setTimeout(45_000);
  const code="1234567890abcdef12";
  const editorToken="b".repeat(64);
  let published=false;
  let recipient="A definir";
  let recipe=["intro","door","memories","voices","light","stars","scratch","hold","letter","finale"];

  await page.addInitScript(({key,token})=>localStorage.setItem(key,token),{
    key:`thi_editor_access:${code}`,token:editorToken,
  });

  await page.route("**/functions/v1/creator-api",async route=>{
    const body=JSON.parse(route.request().postData()||"{}") as Record<string,unknown>;
    expect(body.editorToken).toBe(editorToken);
    if(body.action==="openStudio"){
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({
        gift:{
          public_code:code,status:published?"published":"paid",template_version:"live",experience_slug:"pareja",
          giver_name:"Mauro",recipient_name:recipient,occasion:null,feeling:"Emoción",
          opening_text:null,letter_text:null,closing_text:null,music_url:null,scene_recipe:recipe,
          story_data:{relationship:"",keyDate:"",anecdote:"",sceneContent:{}},theme_data:{},published_at:published?new Date().toISOString():null,
        },
        order:{status:"approved",amount_minor:2500000,currency:"ARS"},
        media:[],
      })});
    }
    if(body.action==="saveStudioBasics"){
      recipient=String(body.recipientName||recipient);
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true})});
    }
    if(body.action==="saveStudioRecipe"){
      recipe=(body.sceneRecipe as string[])||recipe;
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true,sceneRecipe:recipe})});
    }
    if(body.action==="publishStudio"){
      published=true;
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true,giftUrl:`https://tehiceesto.com/r/${code}`})});
    }
    return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true,sceneContent:{}})});
  });

  await page.setViewportSize({width:390,height:844});
  await page.goto(`/tehiceesto/editar/${code}`);

  await expect(page.getByRole("heading",{name:/¿Quién va a recibir esto\?/i})).toBeVisible();
  await expect(page.getByText(/scene_recipe|metadata/i)).toHaveCount(0);
  mkdirSync("visual-qa-evidence",{recursive:true});
  const startShot="visual-qa-evidence/tehiceesto-studio-mobile-start.png";
  await page.screenshot({path:startShot,fullPage:true});
  await testInfo.attach("tehiceesto-studio-mobile-start",{path:startShot,contentType:"image/png"});
  await page.getByPlaceholder("Ej. Ailín").fill("Ailín");
  await page.getByRole("button",{name:/Continuar/i}).click();

  await expect(page.getByRole("heading",{name:/Elegí las fotos/i})).toBeVisible();
  await page.getByRole("button",{name:/Continuar/i}).click();
  await expect(page.getByRole("heading",{name:/Hay cosas que emocionan distinto/i})).toBeVisible();
  await page.getByRole("button",{name:/Continuar/i}).click();
  await expect(page.getByRole("heading",{name:/Decile lo importante/i})).toBeVisible();
  await page.locator(".studio-field.important textarea").fill("Gracias por caminar conmigo. Esto recién empieza.");
  await page.getByRole("button",{name:/Continuar/i}).click();

  await expect(page.getByRole("heading",{name:/Tu regalo ya viene armado/i})).toBeVisible();
  await expect(page.locator(".studio-section-list")).toBeHidden();
  await page.getByRole("button",{name:/Ver mi regalo/i}).click();

  await expect(page.getByRole("heading",{name:/Vivilo antes de mandarlo/i})).toBeVisible();
  const copyTool=page.getByRole("button",{name:/Editar textos de esta parte/i});
  await expect(copyTool).toBeVisible();
  await copyTool.click();
  await expect(page.getByText(/Cuando guardes el cambio, el recorrido se habilita solo/i)).toBeVisible();
  await page.locator(".studio-preview-stage .thi-kicker").first().click();
  const copySheet=page.locator(".studio-copy-sheet");
  await expect(copySheet).toBeVisible();
  await copySheet.locator("textarea").fill("Una frase personalizada");
  await copySheet.getByRole("button",{name:/Guardar y seguir/i}).click();
  await expect(page.getByRole("button",{name:/Editar textos de esta parte/i})).toBeVisible();
  await expect(page.locator(".studio-copy-hint")).toHaveCount(0);

  const visited:string[]=[];
  for(let index=0;index<12;index++){
    const current=await sceneName(page);
    visited.push(current);
    if(current==="finale")break;
    await advanceOne(page);
  }
  expect(visited).not.toContain("voices");
  expect(visited).not.toContain("light");
  await expect(page.locator('[data-action="create-story"]')).toHaveCount(0);

  await page.waitForTimeout(300);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  const previewShot="visual-qa-evidence/tehiceesto-studio-mobile-preview.png";
  await page.screenshot({path:previewShot,fullPage:true});
  await testInfo.attach("tehiceesto-studio-mobile-preview",{path:previewShot,contentType:"image/png"});
  await page.getByRole("button",{name:/Publicar mi regalo/i}).first().click();

  await expect(page.getByRole("heading",{name:/Tu regalo está listo para vivirlo/i})).toBeVisible();
  await expect(page.getByRole("link",{name:/Abrir antes de enviar/i})).toHaveAttribute("href",`/tehiceesto/r/${code}`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});


test("customer studio makes media replace and remove obvious",async({page})=>{
  test.setTimeout(45_000);
  const code="abcdef1234567890ab";
  const editorToken="c".repeat(64);
  let replaced=false;
  let media=[
    {id:"photo-1",kind:"image",storage_path:"x/photo.jpg",caption:"Nuestro día",sort_order:0,metadata:{fit:"cover",position:"center",scene:"memories"},url:"data:image/gif;base64,R0lGODlhAQABAAAAACw="},
    {id:"audio-1",kind:"audio",storage_path:"x/voice.ogg",caption:"Mensaje",sort_order:1,metadata:{scene:"voices",role:"voice"},url:null},
    {id:"video-1",kind:"video",storage_path:"x/video.mp4",caption:null,sort_order:2,metadata:{scene:"memories"},url:null},
  ];

  await page.addInitScript(({key,token})=>localStorage.setItem(key,token),{
    key:`thi_editor_access:${code}`,token:editorToken,
  });

  await page.route("**/functions/v1/creator-api",async route=>{
    const body=JSON.parse(route.request().postData()||"{}") as Record<string,unknown>;
    if(body.action==="openStudio"){
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({
        gift:{
          public_code:code,status:"paid",template_version:"live",experience_slug:"pareja",
          giver_name:"Mauro",recipient_name:"Ailín",occasion:null,feeling:"Emoción",
          opening_text:null,letter_text:null,closing_text:null,music_url:null,
          scene_recipe:["intro","door","memories","voices","light","stars","scratch","hold","letter","finale"],
          story_data:{relationship:"",keyDate:"",anecdote:"",sceneContent:{}},theme_data:{},published_at:null,
        },
        order:{status:"approved",amount_minor:2500000,currency:"ARS"},
        media,
      })});
    }
    if(body.action==="prepareStudioUpload"){
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({
        path:`${code}/studio-new-photo.png`,token:"signed-test-token",kind:"image",
      })});
    }
    if(body.action==="replaceStudioMedia"){
      replaced=true;
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true})});
    }
    if(body.action==="deleteStudioMedia"){
      media=media.filter(item=>item.id!==String(body.mediaId));
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true})});
    }
    return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true})});
  });

  await page.route("**/storage/v1/object/upload/sign/gift-media/**",route=>
    route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({Key:"ok"})})
  );

  await page.setViewportSize({width:390,height:844});
  await page.goto(`/tehiceesto/editar/${code}`);
  await page.getByRole("button",{name:/Continuar/i}).click();

  const photo=page.locator(".studio-photo-grid article").first();
  await expect(photo).toBeVisible();
  await expect(photo.getByRole("button",{name:"Cambiar foto"})).toBeVisible();
  await expect(photo.getByRole("button",{name:"Quitar"})).toBeVisible();
  await expect(page.locator(".studio-video-card")).toBeVisible();

  const chooserPromise=page.waitForEvent("filechooser");
  await photo.getByRole("button",{name:"Cambiar foto"}).click();
  const chooser=await chooserPromise;
  await chooser.setFiles({name:"nueva.png",mimeType:"image/png",buffer:Buffer.from("89504e470d0a1a0a","hex")});
  await expect.poll(()=>replaced).toBe(true);
  await expect(page.getByText(/lo cambiamos sin mover nada/i)).toBeVisible();

  page.once("dialog",dialog=>dialog.accept());
  await photo.getByRole("button",{name:"Quitar"}).click();
  await expect(page.locator(".studio-photo-grid article")).toHaveCount(0);

  await page.getByRole("button",{name:/Continuar/i}).click();
  await expect(page.locator(".studio-audio-list article")).toHaveCount(1);
  const audio=page.locator(".studio-audio-list article").first();
  await expect(audio.getByRole("button",{name:"Cambiar audio"})).toBeVisible();
  await expect(audio.getByRole("button",{name:"Quitar"})).toBeVisible();
});

test("affiliate dashboards stay private and mobile-safe",async({page})=>{
  await page.setViewportSize({width:390,height:844});

  await page.goto("/tehiceesto/afiliados/sofia");
  await expect(page.getByRole("heading",{name:/Tu recomendación/i})).toBeVisible();
  await expect(page.getByText(/datos de compradores permanecen privados/i)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

  await page.goto("/tehiceesto/admin/afiliados");
  await expect(page.getByRole("heading",{name:"Afiliados"})).toBeVisible();
  await expect(page.getByRole("link",{name:/Ir al panel/i})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("affiliate referral stores attribution and returns to Te Hice Esto",async({page})=>{
  await page.route("**/functions/v1/affiliate-public",async route=>{
    const body=JSON.parse(route.request().postData()||"{}") as Record<string,unknown>;
    expect(body.action).toBe("track");
    expect(body.code).toBe("sofia");
    expect(body.source).toBe("instagram");
    return route.fulfill({
      status:200,
      contentType:"application/json",
      headers:{"access-control-allow-origin":"*"},
      body:JSON.stringify({
        ok:true,
        affiliateSlug:"sofia",
        affiliateToken:"affiliate-token-test-12345678901234567890",
        expiresAt:new Date(Date.now()+30*24*60*60*1000).toISOString(),
      }),
    });
  });

  await page.goto("/tehiceesto/r/sofia?src=instagram");
  await page.waitForURL(/\/tehiceesto\/?$/);
  const cookies=await page.context().cookies();
  expect(cookies.find(cookie=>cookie.name==="thi_affiliate_code")?.value).toBe("sofia");
  expect(cookies.find(cookie=>cookie.name==="thi_affiliate_token")?.value).toBe("affiliate-token-test-12345678901234567890");
});

test("Mercado Pago checkout health endpoint is explicit",async({request})=>{
  const response=await request.get("https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout?status=1");
  expect(response.ok()).toBeTruthy();
  const data=await response.json() as {configured?:boolean;tokenValid?:boolean;webhookSecretPresent?:boolean;provider?:string};
  expect(data.provider).toBe("mercadopago");
  expect(typeof data.configured).toBe("boolean");
  expect(typeof data.tokenValid).toBe("boolean");
  expect(typeof data.webhookSecretPresent).toBe("boolean");
  if(data.configured){
    expect(data.tokenValid).toBe(true);
    expect(data.webhookSecretPresent).toBe(true);
  }
});
