import { expect,test,type Page } from "playwright/test";
const slugs=["pareja","cumpleanos","hijos","abuelos","aniversario","propuesta","mama","papa","amistad"];
async function sceneName(page:Page){return page.locator("main.thi-experience").getAttribute("data-scene")}
async function waitForScene(page:Page,name:string){await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene",name)}
async function advanceOne(page:Page){
  const current=await sceneName(page);if(!current)throw new Error("missing_scene");
  if(current==="intro")await page.locator('[data-action="advance"]').click();
  else if(current==="door"){await page.locator('[data-action="open-door"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="memories"||current==="timeline"||current==="video")await page.locator('[data-action="advance"]').click();
  else if(current==="light"){await page.locator('[data-action="light-reveal"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="hold"){await page.locator('[data-action="hold"]').press("Enter");await page.locator('[data-action="advance"]').click()}
  else if(current==="stars"){const items=page.locator('[data-action="star"]');await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator('[data-action="advance"]').click()}
  else if(current==="scratch"){await page.locator('[data-action="scratch-fallback"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="letter"){await page.locator('[data-action="open-letter"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="candles"){await page.locator('[data-action="blow-fallback"]').click();await page.locator('[data-action="advance"]').click()}
  else if(current==="balloons"){const items=page.locator('[data-action="balloon"]');await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator('[data-action="advance"]').click()}
  else if(current==="voices"){const demo=page.locator('[data-action="demo-voice"]').first();if(await demo.count())await demo.click();else await page.locator('[data-action="real-audio"]').first().evaluate((el:HTMLAudioElement)=>el.dispatchEvent(new Event("play",{bubbles:true})));await page.locator('[data-action="advance"]').click()}
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
  else if(current==="care"){const items=page.locator(".care-grid button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
  else if(current==="sacrifices"){const items=page.locator(".sacrifice-list button");await items.nth(0).click();await items.nth(1).click();await items.nth(2).click();await page.locator(".scene .primary-action").click()}
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
for(const slug of slugs)test(`Te Hice Esto demo ${slug} completes without getting stuck`,async({page})=>{test.setTimeout(45_000);await page.setViewportSize({width:390,height:844});await page.goto(`/tehiceesto/experiencias/${slug}`);await waitForScene(page,"intro");for(let step=0;step<20;step++){const current=await sceneName(page);if(current==="finale"||current==="proposal")break;const before=current;await advanceOne(page);await expect.poll(()=>sceneName(page),{timeout:4000,message:`${slug} did not advance from scene ${before}`}).not.toBe(before)}expect(["finale","proposal"],`${slug} never reached an ending`).toContain(await sceneName(page))});
test("scene state resets when revisiting and restart always starts clean",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/tehiceesto/experiencias/cumpleanos");await advanceOne(page);await waitForScene(page,"candles");await page.locator('[data-action="blow-fallback"]').click();await page.locator('[data-action="advance"]').click();await waitForScene(page,"balloons");const balloons=page.locator('[data-action="balloon"]');await balloons.nth(0).click();await expect(balloons.nth(0)).toHaveClass(/pop/);await page.locator('[data-action="previous"]').click();await waitForScene(page,"candles");await expect(page.locator(".thi-birthday-ritual")).not.toHaveClass(/out/);await page.locator('[data-action="blow-fallback"]').click();await page.locator('[data-action="advance"]').click();await waitForScene(page,"balloons");await expect(page.locator(".thi-balloons button.pop")).toHaveCount(0);await balloons.nth(0).click();await balloons.nth(1).click();await page.locator('.thi-reset-journey[data-action="restart"]').click();await waitForScene(page,"intro")});
test("all visible scene copy can be overridden without changing the engine",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/tehiceesto/experiencias/pareja");await expect(page.getByText(/armó esto pensando en vos/i)).toBeVisible();await page.locator('[data-action="advance"]').click();await expect(page.getByText(/No todo empieza con una fecha/i)).toBeVisible()});
test("pareja includes an intimate voice-note scene before the light reveal",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/tehiceesto/experiencias/pareja");await waitForScene(page,"intro");await advanceOne(page);await waitForScene(page,"door");await advanceOne(page);await waitForScene(page,"memories");await advanceOne(page);await waitForScene(page,"voices");await page.locator('[data-action="demo-voice"]').click();await expect(page.getByText(/desde que estás vos/i)).toBeVisible();await expect(page.locator('[data-action="advance"]')).toBeEnabled()});


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


test("creator handoff persists the private draft before opening WhatsApp",async({page})=>{
  test.setTimeout(45_000);
  const calls:string[]=[];
  const code="0123456789abcdef01";

  await page.route("**/functions/v1/creator-api",async route=>{
    const request=route.request();
    const body=JSON.parse(request.postData()||"{}") as Record<string,unknown>;
    const action=String(body.action||"");
    calls.push(action);
    if(action==="submitDraft"){
      expect(body.experienceSlug).toBe("pareja");
      expect(body.giverName).toBe("Mauro");
      expect(body.recipientName).toBe("Ailin");
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({code})});
    }
    if(action==="resetCreatorMedia"){
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,removed:0})});
    }
    if(action==="prepareUpload"){
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({path:`${code}/creator-test-recuerdo.jpg`,token:"signed-token"})});
    }
    if(action==="registerMedia"){
      expect(String(body.storagePath)).toContain(code);
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true})});
    }
    return route.fulfill({status:400,contentType:"application/json",body:JSON.stringify({error:"unexpected_action"})});
  });

  await page.route("**/storage/v1/object/upload/sign/gift-media/**",route=>
    route.fulfill({status:200,contentType:"application/json",body:"{}"})
  );
  await page.route("https://wa.me/**",route=>
    route.fulfill({status:200,contentType:"text/html",body:"<html><body>whatsapp handoff</body></html>"})
  );

  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/crear");
  await page.locator(".creator-step .primary-action").click();

  await page.getByPlaceholder("Ej. Mauro").fill("Mauro");
  await page.getByPlaceholder("Ej. Ailín").fill("Ailin");
  await page.getByRole("button",{name:"Seguir"}).click();

  await page.getByRole("button",{name:"Agregar recuerdos"}).click();
  await page.locator('input[type="file"]').setInputFiles({
    name:"recuerdo.jpg",
    mimeType:"image/jpeg",
    buffer:Buffer.from("fake-jpeg"),
  });
  await page.getByRole("button",{name:"Escribir la parte importante"}).click();
  await page.locator(".story-field-important textarea").fill("Esta es una carta de prueba para validar el flujo completo.");
  await page.getByRole("button",{name:"Ver lo que creamos"}).click();

  await page.locator("button.creator-whatsapp-primary").click();
  await page.waitForURL(/wa\.me/);

  expect(calls).toContain("submitDraft");
  expect(calls).toContain("resetCreatorMedia");
  expect(calls).toContain("prepareUpload");
  expect(calls).toContain("registerMedia");
  expect(decodeURIComponent(page.url())).toContain(code.toUpperCase());
});
