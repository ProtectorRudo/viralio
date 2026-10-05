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
  else if(current==="stars"){const items=page.locator('[data-action="star"]');const count=await items.count();for(let i=0;i<count;i++)await items.nth(i).click();await page.locator('[data-action="advance"]').click()}
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
  const rows=5;

  await page.mouse.move(left,top);
  await page.mouse.down();
  for(let row=0;row<rows;row++){
    const y=top+row*((box.height-76)/(rows-1));
    const fromX=row%2===0?left:right;
    const toX=row%2===0?right:left;
    await page.mouse.move(fromX,y,{steps:3});
    await page.mouse.move(toX,y,{steps:18});
  }
  await page.mouse.up();

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
