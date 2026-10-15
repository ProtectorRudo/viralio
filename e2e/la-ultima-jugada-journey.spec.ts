import {test,expect,type Page} from "@playwright/test";

test.use({launchOptions:{args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl","--enable-unsafe-swiftshader"]}});
test.setTimeout(180_000);

async function walk(page:Page,key:"w"|"a"|"s"|"d",ms:number){
 await page.keyboard.down(key);
 await page.waitForTimeout(ms);
 await page.keyboard.up(key);
}

async function orient(page:Page){
 await page.getByRole("button",{name:"Mostrar u ocultar pista"}).click();
 await page.getByRole("button",{name:/ORIENTARME/}).click();
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
 await expect(page.locator(".lj-canvas-frame canvas")).toBeVisible();
 await expect.poll(()=>page.locator(".lj-canvas-frame canvas").getAttribute("data-player-position"),{timeout:20_000}).not.toBeNull();
 await expect(page.locator(".lj-loading-scene")).toHaveCount(0);
 // Move around the analysis desk instead of walking through solid furniture.
 await walk(page,"d",1300);
 const afterStrafe=(await page.locator(".lj-canvas-frame canvas").getAttribute("data-player-position")||"0,0").split(",").map(Number);
 expect(afterStrafe[0],"Keyboard movement should enter the right-hand aisle").toBeGreaterThan(2.25);
 // Use the aisle next to the furniture before turning toward the rear monitors.
 await walk(page,"w",2400);
 const afterAisle=(await page.locator(".lj-canvas-frame canvas").getAttribute("data-player-position")||"0,0").split(",").map(Number);
 expect(afterAisle[1],"Walking forward in the clear side aisle").toBeLessThan(-.5);
 await reachAction(page,/Reconstruí la jugada/i,true);
 await page.getByRole("button",{name:/CÁMARA 2/}).click();
 await solve(page);
 await expect(page.locator(".lj-objective p")).toContainText("pizarra");
 await reachAction(page,/informe/i,true);
 for(const [player,slot] of [[7,"banda derecha"],[10,"medialuna"],[9,"primer palo"]] as const){
   await page.getByRole("button",{name:"Jugador "+player,exact:true}).click();
   await page.getByRole("button",{name:"Mover jugador "+player+" a "+slot}).click();
 }
 await solve(page);
 await reachAction(page,/corredor/i);
 await reachAction(page,/comunicaciones/i);
 await expect(page.locator(".lj-brand small")).toHaveText("CORREDOR RESTRINGIDO");
 await reachAction(page,/cámaras/i,true);
 await page.getByRole("button",{name:"Cambiar ROJO"}).click();
 await page.getByRole("button",{name:"Cambiar AZUL"}).click();
 await page.getByRole("button",{name:"Cambiar AZUL"}).click();
 await solve(page);
 await reachAction(page,/saboteador/i,true);
 await page.getByRole("button",{name:"CREDENCIAL 09"}).click();
 await solve(page);
 await reachAction(page,/Verificá la táctica/i);
 await expect(page.locator(".lj-brand small")).toHaveText("TÚNEL DE LA FINAL");
 await reachAction(page,/entrenador/i,true);
 await page.getByRole("button",{name:/Atraer la marca al centro/}).click();
 await solve(page);
 for(let attempt=0;attempt<13;attempt++){
   if(await page.locator(".lj-root-finale").isVisible())break;
   await orient(page);
   await page.getByRole("button",{name:"Interactuar con el objeto enfocado"}).click();
   if(await page.locator(".lj-root-finale").isVisible())break;
   await walk(page,"w",680);
 }
 await expect(page.locator(".lj-root-finale")).toBeVisible();
 await expect(page.getByText("¡¡GOOOOOOOL DE ARGENTINA!!")).toBeVisible({timeout:17000});
 await page.screenshot({path:"test-results/la-ultima-jugada-gol-3d.png",fullPage:true});
 await expect(page.getByText("CAMPEONES DEL MUNDO")).toBeVisible({timeout:19000});
 await page.screenshot({path:"test-results/la-ultima-jugada-final-victoria.png",fullPage:true});
 expect(errors).toEqual([]);
});
