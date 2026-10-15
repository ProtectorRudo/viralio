import {test,expect,type Page} from "@playwright/test";

test.use({launchOptions:{args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl","--enable-unsafe-swiftshader"]}});
test.setTimeout(300_000);

async function walk(page:Page,key:"w"|"a"|"s"|"d",ms:number){
 await page.keyboard.down(key);
 await page.waitForTimeout(ms);
 await page.keyboard.up(key);
}


async function walkUntil(page:Page,key:"w"|"a"|"s"|"d",axis:"x"|"z",goal:number,direction:"gte"|"lte"){
 await page.keyboard.down(key);
 try{
  await expect.poll(async()=>{
   const raw=await page.locator(".lj-canvas-frame canvas").getAttribute("data-player-position");
   if(!raw)return false;
   const numbers=raw.split(",").map(Number);
   const value=axis==="x"?numbers[0]:numbers[1];
   return direction==="gte"?value>=goal:value<=goal;
  },{timeout:16_000,intervals:[130,190,330,500]})
   .toBe(true);
 }finally{await page.keyboard.up(key);}
}

async function orient(page:Page){
 const open=page.getByRole("dialog",{name:"Acertijo interactivo"});
 if(await open.isVisible().catch(()=>false)){
  const title=await open.locator("h2").innerText().catch(()=>"desconocido");
  const objective=await page.locator(".lj-objective p").innerText().catch(()=>"desconocido");
  throw new Error("Unexpected modal opened while navigating: "+title+" / objective="+objective);
 }
 await page.getByRole("button",{name:"Mostrar u ocultar pista"}).click({timeout:6000});
 await page.getByRole("button",{name:/ORIENTARME/}).click({timeout:6000});
}
async function reachAction(page:Page,nextText:RegExp,puzzle=false){
 for(let attempt=0;attempt<13;attempt++){
  await orient(page);
  await page.getByRole("button",{name:"Interactuar con el objeto enfocado"}).click();
  if(puzzle && await page.getByRole("dialog",{name:"Acertijo interactivo"}).isVisible().catch(()=>false))return;
  if(!puzzle && await page.locator(".lj-objective p").getByText(nextText).isVisible().catch(()=>false))return;
  if(attempt===4||attempt===8)await walk(page,"d",680);
  else await walk(page,"w",660);
 }
 throw new Error("Could not reach interaction "+nextText+" / "+await page.locator(".lj-objective p").innerText()+
 " position="+await page.locator(".lj-canvas-frame canvas").getAttribute("data-player-position")+
 " yaw="+await page.locator(".lj-canvas-frame canvas").getAttribute("data-player-yaw")+
 " focus="+await page.locator(".lj-canvas-frame canvas").getAttribute("data-focus-target")+
 " aim="+await page.locator(".lj-canvas-frame canvas").getAttribute("data-aim-target"));
}
async function solve(page:Page){
 await page.getByRole("button",{name:"VERIFICAR RESPUESTA ↗"}).click();
 await expect(page.getByRole("dialog")).toHaveCount(0);
 if(await page.locator(".lj-cinematic").count())await expect(page.locator(".lj-cinematic")).toHaveCount(0,{timeout:8000});
}

test("full Argentina–England investigation physically reaches every room and triggers 3D goal",async({page})=>{
 const errors:string[]=[];page.on("pageerror",err=>errors.push(err.message));
 await page.goto("/la-ultima-jugada");
 await page.getByRole("button",{name:/INICIAR MISIÓN/}).click();
 await expect(page.getByRole("dialog",{name:"Orden de misión"})).toBeVisible();
 await expect(page.getByText("¿Cuál de las tres cámaras muestra la grabación auténtica?")).toBeVisible();
 await page.getByRole("button",{name:/COMENZAR CUENTA REGRESIVA/}).click();
 await expect(page.getByRole("dialog",{name:"Orden de misión"})).toHaveCount(0);
 await expect(page.locator(".lj-canvas-frame canvas")).toBeVisible();
 await expect.poll(()=>page.locator(".lj-canvas-frame canvas").getAttribute("data-player-position"),{timeout:20_000}).not.toBeNull();
 await expect(page.locator(".lj-loading-scene")).toHaveCount(0);
 // Follow a physical aisle without frame-rate-dependent distances.
 // Slow software WebGL should not penalize a user for having low FPS.
 await walkUntil(page,"d","x",3,"gte");
 await walkUntil(page,"w","z",-1.4,"lte");
 await reachAction(page,/Reconstruí la jugada/i,true);
 await page.screenshot({timeout:17_000,animations:"disabled",path:"test-results/la-ultima-jugada-replay-terminal.png",fullPage:false});
 await page.getByRole("button",{name:/CÁMARA 2/}).click();
 for(const name of ["La pelota aparece de golpe en otra zona","Veo dos pelotas al mismo tiempo","Hay una cámara con movimiento continuo"]){
  await page.getByRole("button",{name:new RegExp(name)}).click();
 }
 await solve(page);
 await expect(page.locator(".lj-objective p")).toContainText("fichas");
 await reachAction(page,/fichas/i,true);
 await page.screenshot({timeout:17_000,animations:"disabled",path:"test-results/la-ultima-jugada-magnetic-tactics.png",fullPage:false});
 for(const [player,slot] of [[7,"banda derecha"],[10,"medialuna"],[9,"primer palo"]] as const){
   await page.getByRole("button",{name:"Jugador "+player,exact:true}).click();
   await page.getByRole("button",{name:"Mover jugador "+player+" a "+slot}).click();
 }
 await solve(page);
 for(let index=1;index<=4;index++){
  await reachAction(page,index<4?new RegExp("\\("+index+"\\/4\\)"): /Ordená los cuatro fragmentos/i);
 }
 await reachAction(page,/ordená los cuatro fragmentos/i,true);
 for(const label of ["PLANO","SELLO","RUTA","FIRMA"]){
  await page.getByRole("button",{name:new RegExp(label+"$")}).click();
 }
 await solve(page);
 await reachAction(page,/Descifrá qué casillero/i);
 await expect(page.locator(".lj-brand small")).toHaveText("CORREDOR RESTRINGIDO");
 await expect(page.locator(".lj-loading-scene")).toHaveCount(0);
 await page.waitForTimeout(900);
 await page.screenshot({timeout:17_000,animations:"disabled",path:"test-results/la-ultima-jugada-corredor-3d.png",fullPage:false});
 await reachAction(page,/llave/i,true);
 await page.getByRole("button",{name:/CASILLERO 04/}).click();
 await page.getByRole("textbox",{name:"Código del casillero"}).fill("247");
 await solve(page);
 await reachAction(page,/Repará la central/i,true);
 await page.getByRole("button",{name:"Cambiar ROJO"}).click();
 for(let n=0;n<3;n++)await page.getByRole("button",{name:"Cambiar AZUL"}).click();
 for(let n=0;n<2;n++)await page.getByRole("button",{name:"Cambiar VERDE"}).click();
 await solve(page);
 await reachAction(page,/saboteador/i,true);
 await page.getByRole("button",{name:"CREDENCIAL 09"}).click();
 await solve(page);
 await reachAction(page,/tres pistas/i);
 await expect(page.locator(".lj-brand small")).toHaveText("TÚNEL DE LA FINAL");
 await expect(page.locator(".lj-loading-scene")).toHaveCount(0);
 await page.waitForTimeout(900);
 await page.screenshot({timeout:17_000,animations:"disabled",path:"test-results/la-ultima-jugada-tunel-3d.png",fullPage:false});
 await reachAction(page,/tres pistas/i,true);
 await page.getByRole("button",{name:/La ruta que coincide con las fichas/i}).click();
 for(const stamp of ["C2","04","ROJO"]){
  await page.getByRole("button",{name:stamp,exact:true}).click();
 }
 await solve(page);
 // Regression guard: the terminal must restore first-person movement.
 await expect.poll(()=>page.locator(".lj-canvas-frame canvas").getAttribute("data-gameplay-active"),{timeout:5000}).toBe("true");
 await walkUntil(page,"w","z",2.5,"lte");
 // Approach the coach physically, then aim at him and deliver the report.
 // Unlike the previous retry loop, this asserts the actual 3D proximity and
 // fails with telemetry rather than waiting for the whole test timeout.
 await walkUntil(page,"w","z",-3.4,"lte");
 // The previous puzzle can finish against the left-hand wall. Turning to
 // face the coach is not sufficient: walk across the physical tunnel aisle.
 await orient(page);
 await walkUntil(page,"w","x",-1,"gte");
 await orient(page);
 await expect.poll(()=>page.locator(".lj-canvas-frame canvas").getAttribute("data-focus-target"),{timeout:6500}).toBe("entrega");
 await page.screenshot({path:"test-results/la-ultima-jugada-tecnico-primer-plano.png",fullPage:false,timeout:17000});
 await page.getByRole("button",{name:"Interactuar con el objeto enfocado"}).click();
 await expect(page.locator(".lj-root-finale")).toBeVisible({timeout:12000});
 await expect(page.getByText("¡¡GOOOOOOOL DE ARGENTINA!!")).toBeVisible({timeout:17000});
 await page.screenshot({timeout:17_000,animations:"disabled",path:"test-results/la-ultima-jugada-gol-3d.png",fullPage:false});
 await expect(page.getByText("CAMPEONES DEL MUNDO")).toBeVisible({timeout:19000});
 await expect(page.getByLabel("Resultado de la misión")).toBeVisible();
 await expect(page.getByText("TIEMPO DE RESOLUCIÓN")).toBeVisible();
 await page.screenshot({timeout:17_000,animations:"disabled",path:"test-results/la-ultima-jugada-final-victoria.png",fullPage:false});
 const desktopTitle=await page.locator(".lj-root-victory .lj-ending h1").boundingBox();
 expect(desktopTitle?.y,"The winner's headline must not be clipped on desktop").toBeGreaterThanOrEqual(0);
 await page.setViewportSize({width:390,height:844});
 await expect(page.getByText("CAMPEONES DEL MUNDO")).toBeVisible();
 const mobileTitle=await page.locator(".lj-root-victory .lj-ending h1").boundingBox();
 expect(mobileTitle?.y,"The winner's headline must not be clipped on mobile").toBeGreaterThanOrEqual(0);
 const hasHorizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
 expect(hasHorizontalOverflow).toBe(false);
 await page.screenshot({timeout:17_000,animations:"disabled",path:"test-results/la-ultima-jugada-final-victoria-mobile.png",fullPage:false});
 expect(errors).toEqual([]);
});
