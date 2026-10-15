import {test,expect} from "@playwright/test";
test.use({launchOptions:{args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl","--enable-unsafe-swiftshader"]}});

test("La Última Jugada runs the 3D match investigation on desktop",async({page})=>{
 const errors:string[]=[];page.on("pageerror",err=>errors.push(err.message));
 const glbResponses=new Map<string,number>();
 page.on("response",response=>{
  const file=response.url().match(/\/la-ultima-jugada\/models\/([^/?]+\.glb)/)?.[1];
  if(file)glbResponses.set(file,response.status());
 });
 await page.goto("/la-ultima-jugada");
 await expect(page.getByRole("heading",{name:/LA ÚLTIMA/})).toBeVisible();
 await expect(page.getByText("INGLATERRA",{exact:true})).toBeVisible();
 await page.getByRole("button",{name:/INICIAR MISIÓN/}).click();
 await expect(page.locator("canvas")).toBeVisible();
 for(const asset of ["player-quaternius.glb","desk-kari.glb","chair-olve.glb"]){
  expect(glbResponses.get(asset),"First-party GLB must load successfully: "+asset).toBe(200);
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
 await expect(page.locator("canvas")).toBeVisible();
 await expect(page.getByRole("button",{name:"lj-forward"})).toBeVisible();
 await expect(page.getByRole("button",{name:"Interactuar con el objeto enfocado"})).toBeVisible();
 await page.getByRole("button",{name:"Mostrar u ocultar pista"}).tap();
 await expect(page.getByText("PISTA / 01")).toBeVisible();
 await page.waitForTimeout(1100);
 await page.screenshot({path:"test-results/la-ultima-jugada-mobile.png",fullPage:true});
 expect(errors).toEqual([]);
 await context.close();
});
