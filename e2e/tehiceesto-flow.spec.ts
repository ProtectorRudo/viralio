import { expect,test,type Page } from "playwright/test";
const slugs=["pareja","cumpleanos","hijos","abuelos","aniversario","propuesta","mama","papa","amistad"];
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
  else if(current==="lessons"){const items=page.locator(".lesson-ledger button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
  else if(current==="presence"){const items=page.locator(".presence-track button");await items.nth(0).click();await items.nth(1).click();await page.locator(".scene .primary-action").click()}
  else if(current==="inheritance"){const items=page.locator(".inheritance-board button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
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
  await expect(page.getByRole("heading",{name:/Un regalo hecho con sus recuerdos/i})).toBeVisible();
  await expect(page.getByText(/Convertimos tus fotos, audios y mensajes/i)).toBeVisible();
  await expect(page.locator(".thh-v2-meta")).toContainText("Desde");
  await expect(page.locator(".thh-v2-meta strong")).toContainText("$");

  const chooser=page.locator(".thh-v2-chooser");
  await expect(chooser).toBeVisible();
  await expect(chooser.getByText("¿Para quién querés hacerlo?")).toBeVisible();
  await expect(page.locator(".thh-v2-recipient")).toHaveCount(6);
  await expect(page.getByRole("link",{name:"Ver experiencia para Mamá"})).toHaveAttribute("href","/tehiceesto/experiencias/mama");

  await expect(page.locator(".floating-whatsapp--home")).toBeHidden();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await expect(page.getByRole("heading",{name:/No recibe una página/i})).toBeAttached();
  await expect(page.getByText("Nosotros hacemos la magia")).toBeAttached();
  await expect(page.locator(".thh-v2-price strong")).toContainText("$");
});

for(const slug of slugs)test(`Te Hice Esto demo ${slug} completes without getting stuck`,async({page})=>{test.setTimeout(45_000);await page.setViewportSize({width:390,height:844});await page.goto(`/tehiceesto/experiencias/${slug}`);await waitForScene(page,"intro");for(let step=0;step<20;step++){const current=await sceneName(page);if(current==="finale"||current==="proposal")break;const before=current;await advanceOne(page);await expect.poll(()=>sceneName(page),{timeout:4000,message:`${slug} did not advance from scene ${before}`}).not.toBe(before)}expect(["finale","proposal"],`${slug} never reached an ending`).toContain(await sceneName(page))});
test("scene state resets when revisiting and restart always starts clean",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/tehiceesto/experiencias/cumpleanos");await advanceOne(page);await waitForScene(page,"candles");await page.locator('[data-action="blow-fallback"]').click();await page.locator('[data-action="advance"]').click();await waitForScene(page,"balloons");const balloons=page.locator('[data-action="balloon"]');await balloons.nth(0).click();await expect(balloons.nth(0)).toHaveClass(/pop/);await page.locator('[data-action="previous"]').click();await waitForScene(page,"candles");await expect(page.locator(".thi-birthday-ritual")).not.toHaveClass(/out/);await page.locator('[data-action="blow-fallback"]').click();await page.locator('[data-action="advance"]').click();await waitForScene(page,"balloons");await expect(page.locator(".thi-balloons button.pop")).toHaveCount(0);await balloons.nth(0).click();await balloons.nth(1).click();await page.locator('.thi-reset-journey[data-action="restart"]').click();await waitForScene(page,"intro")});
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
  await expect(create).toHaveAttribute("href","/tehiceesto/crear");
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
  while((await page.locator("main.thi-experience").getAttribute("data-scene"))!=="letter"){
    await advanceOne(page);
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
  while((await page.locator("main.thi-experience").getAttribute("data-scene"))!=="hold"){
    await advanceOne(page);
  }
  await waitForScene(page,"hold");

  const hold=page.locator('[data-action="hold"]');
  const ritual=page.locator(".thi-hold-reveal.cinematic");
  await expect(ritual).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-progress-premium")).toBeHidden();

  await hold.press("Enter");
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


test("assisted purchase chooses an experience, captures contact and opens checkout",async({page})=>{
  test.setTimeout(45_000);
  const code="THI-ORDER-TEST";

  await page.route("**/functions/v1/order-create",async route=>{
    const request=route.request();
    const body=JSON.parse(request.postData()||"{}") as Record<string,unknown>;
    expect(body.experienceSlug).toBe("pareja");
    expect(body.customerName).toBe("Mauro");
    expect(body.email).toBe("mauro@example.com");
    expect(String(body.whatsapp)).toContain("549221");
    expect(body.consent).toBe(true);
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
      }),
    });
  });

  await page.route("https://checkout.test/**",route=>
    route.fulfill({status:200,contentType:"text/html",body:"<html><body>checkout</body></html>"})
  );

  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/crear");
  await page.getByRole("button",{name:/Elegir para mi pareja/i}).click();

  await page.getByPlaceholder("Ej. Mauro").fill("Mauro");
  await page.getByPlaceholder("Ej. +54 9 221 ...").fill("+54 9 221 555 1234");
  await page.getByPlaceholder("tu@email.com").fill("mauro@example.com");
  await page.locator('.order-consent input[type="checkbox"]').check();
  await page.getByRole("button",{name:/Revisar y pagar/i}).click();

  await expect(page.getByRole("heading",{name:/Tu experiencia empieza acá/i})).toBeVisible();
  await page.getByRole("button",{name:/Pagar con Mercado Pago/i}).click();
  await page.waitForURL(/checkout\.test/);
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
