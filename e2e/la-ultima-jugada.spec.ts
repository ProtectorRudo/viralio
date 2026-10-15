import {test,expect} from "@playwright/test";
test.use({launchOptions:{args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl","--enable-unsafe-swiftshader"]}});

test("La Última Jugada runs the 3D match investigation on desktop",async({page})=>{
 const errors:string[]=[];page.on("pageerror",err=>errors.push(err.message));
 const glbResponses=new Map<string,number>();
 page.on("response",response=>{
  const file=response.url().match(/\/(?:la-ultima-jugada|viralio-3d)\/models\/([^/?]+\.glb)/)?.[1];
  if(file)glbResponses.set(file,response.status());
 });
 await page.goto("/la-ultima-jugada");
 await expect(page.getByRole("heading",{name:/LA ÚLTIMA/})).toBeVisible();
 await expect(page.getByText("INGLATERRA",{exact:true})).toBeVisible();
 await page.getByRole("button",{name:/INICIAR MISIÓN/}).click();
 await expect(page.getByRole("dialog",{name:"Orden de misión"})).toBeVisible();
 await page.screenshot({path:"test-results/la-ultima-jugada-mision-desktop.png",timeout:17000,fullPage:false});
 const startButton=page.getByRole("button",{name:/COMENZAR CUENTA REGRESIVA/});
 await expect.poll(async()=>{
  const rect=await startButton.boundingBox();
  const viewport=page.viewportSize();
  return !!rect&&!!viewport&&rect.y>=0&&rect.y+rect.height<=viewport.height-5;
 },{message:"The briefing CTA must be fully visible without scrolling at 1280x720",timeout:4000}).toBe(true);
 await page.getByRole("button",{name:/COMENZAR CUENTA REGRESIVA/}).click();
 await expect(page.locator("canvas")).toBeVisible();
 await expect(page.locator(".lj-loading-scene")).toHaveCount(0,{timeout:30_000});
 for(const asset of ["player-quaternius.glb","steel-office-desk.glb","chair-olve.glb","video-analysis-27inch-monitor.glb","key-grid-mechanical-keyboard.glb"]){
  await expect.poll(()=>glbResponses.get(asset),{
   message:"First-party GLB must load successfully: "+asset,
   timeout:15_000
  }).toBe(200);
 }
 await expect(page.getByText("OBJETIVO ACTUAL")).toBeVisible();
 await expect(page.getByText("TIEMPO RESTANTE")).toBeVisible();
 const sceneCanvas=page.locator(".lj-canvas-frame canvas");
 await expect.poll(async()=>Number(await sceneCanvas.getAttribute("data-camera-fov"))).toBeGreaterThan(0);
 const initialFov=Number(await sceneCanvas.getAttribute("data-camera-fov"));
 await page.mouse.move(600,440);
 await page.mouse.wheel(0,-190);
 await expect.poll(async()=>Number(await sceneCanvas.getAttribute("data-camera-fov"))).toBeLessThan(initialFov);
 await page.waitForTimeout(1400);
 expect(await page.locator("canvas").evaluate((c)=>!!(c as HTMLCanvasElement).getContext("webgl2"))).toBe(true);
 await page.getByRole("button",{name:"Mostrar u ocultar pista"}).click();
 await expect(page.getByText("PISTA / 01")).toBeVisible();
 await page.getByRole("button",{name:"Cerrar ×"}).click();
 await page.screenshot({path:"test-results/la-ultima-jugada-desktop.png",fullPage:true});
 expect(errors).toEqual([]);
});

test("La Última Jugada remains navigable in a vertical mobile viewport",async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const errors:string[]=[];page.on("pageerror",err=>errors.push(err.message));
 await page.goto("/la-ultima-jugada");
 await expect(page.getByRole("button",{name:/INICIAR MISIÓN/})).toBeVisible();
 await page.getByRole("button",{name:/INICIAR MISIÓN/}).tap();
 await expect(page.getByRole("dialog",{name:"Orden de misión"})).toBeVisible();
 await page.screenshot({path:"test-results/la-ultima-jugada-mision-mobile.png",timeout:17000,fullPage:false});
 await page.getByRole("button",{name:/COMENZAR CUENTA REGRESIVA/}).tap();
 await expect(page.locator("canvas")).toBeVisible();
 await expect(page.getByRole("button",{name:"lj-forward"})).toBeVisible();
 await expect(page.getByRole("button",{name:"Interactuar con el objeto enfocado"})).toBeVisible();
 await page.getByRole("button",{name:"Mostrar u ocultar pista"}).tap();
 await expect(page.getByText("PISTA / 01")).toBeVisible();
 await page.getByRole("button",{name:"Cerrar ×"}).tap();
 const canvas=page.locator(".lj-canvas-frame canvas");
 await expect.poll(()=>canvas.getAttribute("data-player-position"),{timeout:16000}).not.toBeNull();
 const firstZ=Number((await canvas.getAttribute("data-player-position"))?.split(",")[1]);
 const touch=await context.newCDPSession(page);
 const forward=await page.getByRole("button",{name:"lj-forward"}).boundingBox();
 if(!forward)throw new Error("Mobile forward control missing");
 const fx=forward.x+forward.width/2,fy=forward.y+forward.height/2;
 await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:fx,y:fy}]});
 await page.waitForTimeout(1050);
 await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
 await expect.poll(async()=>Number((await canvas.getAttribute("data-player-position"))?.split(",")[1]),{timeout:7000}).toBeLessThan(firstZ-.13);
 // Native Chromium touch inputs prove that mobile two-finger zoom affects
 // actual Three.js camera FOV, without opening a puzzle accidentally.
 const beforeZoom=Number(await canvas.getAttribute("data-camera-fov"));
 await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:220,y:445},{x:275,y:445}]});
 await touch.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:185,y:445},{x:310,y:445}]});
 await page.waitForTimeout(320);
 await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
 await expect.poll(async()=>Number(await canvas.getAttribute("data-camera-fov")),{timeout:7000}).toBeLessThan(beforeZoom);
 await page.waitForTimeout(400);
 await page.screenshot({path:"test-results/la-ultima-jugada-mobile.png",fullPage:false,timeout:17000});
 expect(errors).toEqual([]);
 await context.close();
});
