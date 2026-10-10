import {test,expect,type Page} from "@playwright/test";
import {mkdirSync} from "node:fs";

mkdirSync("visual-qa-evidence",{recursive:true});
async function start(page:Page){
 await page.goto("/rescate-mauro/");
 await expect(page.getByRole("heading",{name:/SECUESTRARON/})).toBeVisible();
 await page.getByRole("button",{name:/ACEPTAR MISIÓN/}).click();
 await expect(page.getByTestId("rescate-mauro-app")).toHaveAttribute("data-stage","game");
 await expect(page.getByTestId("rescate-timer")).toContainText("03:00");
 const canvas=page.getByTestId("rescate-webgl");
 await expect(canvas).toBeVisible();
 await expect.poll(()=>canvas.evaluate((n)=>{
  const c=n as HTMLCanvasElement;
  const gl=c.getContext("webgl");
  return Boolean(gl&&c.width>200&&c.height>200&&gl.getParameter(gl.VERSION).includes("WebGL"));
 })).toBe(true);
}
async function walk(page:Page,key:string,ms:number){
 await page.keyboard.down(key);
 await page.waitForTimeout(ms);
 await page.keyboard.up(key);
}
/** Hold the walk control until the real 3D camera reaches a coordinate.
    Headless software WebGL can render slowly, so a fixed 2-second walk is
    not a portable assertion of distance traveled. */
async function walkTo(page:Page,key:string,axis:"x"|"z",bound:number,direction:"below"|"above"="below"){
 await page.keyboard.down(key);
 try{
  const position=()=>page.getByTestId("rescate-webgl").getAttribute("data-camera-"+axis).then(x=>x===null?NaN:Number(x));
  if(direction==="below")await expect.poll(position,{timeout:20000,intervals:[125,250,450]}).toBeLessThan(bound);
  else await expect.poll(position,{timeout:20000,intervals:[125,250,450]}).toBeGreaterThan(bound);
 }finally{await page.keyboard.up(key)}
}
async function examineNearby(page:Page,name:string){
 const nearby=page.getByTestId("rescate-nearby");
 if(!(await nearby.isVisible()))await page.getByRole("button",{name:/EXPLORAR ALREDEDOR/}).click();
 await expect(nearby).toBeVisible();
 await nearby.getByRole("button",{name:new RegExp(name,"i")}).click({timeout:12000});
 await expect(page.getByRole("dialog")).toBeVisible();
}

test("CASO M · verdadera escena WebGL 3D, joystick y contador de tres minutos",async({page},testInfo)=>{
 await start(page);
 const canvas=page.getByTestId("rescate-webgl");
 await page.waitForTimeout(500);
 const sample=await canvas.evaluate(node=>{
  const c=node as HTMLCanvasElement,gl=c.getContext("webgl")!,rgba=new Uint8Array(4);
  gl.readPixels(Math.floor(c.width*.5),Math.floor(c.height*.5),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
  return Array.from(rgba);
 });
 expect(sample[3]).toBe(255);
 await expect(page.getByTestId("rescate-joystick")).toBeVisible();
 await walk(page,"w",900);
 await page.screenshot({path:`visual-qa-evidence/rescate-mauro-3d-${testInfo.project.name}.png`,fullPage:true});
});

test("CASO M · toque directo sobre el cajón abre el candado",async({page},testInfo)=>{
 await start(page);
 const canvas=page.getByTestId("rescate-webgl");
 const bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();
 const x=bounds!.x+bounds!.width*.5,y=bounds!.y+bounds!.height*.598;
 if(testInfo.project.use.hasTouch)await page.touchscreen.tap(x,y);
 else await page.mouse.click(x,y);
 await expect(page.getByRole("dialog",{name:/Candado de seis cifras/})).toBeVisible();
});


test("CASO M · al minuto final aparece la advertencia y luego el intruso",async({page},testInfo)=>{
 test.setTimeout(150000);
 await page.clock.install();
 await start(page);
 // Run the in-game clock deterministically rather than actually waiting two minutes.
 for(let j=0;j<120;j++)await page.clock.fastForward(1000);
 await expect(page.getByTestId("rescate-timer")).toContainText("01:00");
 await expect(page.getByTestId("rescate-intruder-alert")).toBeVisible();
 for(let j=0;j<10;j++)await page.clock.fastForward(1000);
 await expect(page.getByTestId("rescate-knife-alert")).toBeVisible();
 await expect(page.getByTestId("rescate-knife-alert")).toContainText("NO ESTÁS SOLO");
 await page.screenshot({path:`visual-qa-evidence/rescate-intruso-${testInfo.project.name}.png`,fullPage:true});
});

test("CASO M · ayuda gradual visible y reloj 3D accionable se detiene a las 17:00",async({page})=>{
 test.setTimeout(95000);
 await start(page);
 await page.getByTestId("rescate-hint-button").click();
 const help=page.getByTestId("rescate-hint-panel");
 await expect(help).toBeVisible();
 await expect(help).toContainText("PISTA 1/5");
 await expect(help).toContainText("fotografía");
 await help.getByRole("button",{name:/PEDIR OTRA PISTA/}).click();
 await expect(help).toContainText("PISTA 2/5");
 await help.getByRole("button",{name:"Cerrar pista"}).click();
 await expect(help).toBeHidden();
 await walkTo(page,"d","x",3.0,"above");
 await walkTo(page,"w","z",-2.26);
 await examineNearby(page,"Reloj del interrogatorio");
 const clock=page.getByTestId("rescate-clock");
 await expect(clock).toHaveAttribute("data-clock","idle");
 await clock.getByRole("button",{name:/ACTIVAR Y GIRAR LAS AGUJAS/}).click();
 await expect(clock).toHaveAttribute("data-clock","running");
 await expect(clock).toHaveAttribute("data-clock","done",{timeout:11000});
 await expect(clock).toContainText("17:00 HS");
 await page.getByRole("button",{name:"VOLVER A LA SALA"}).click();
 await examineNearby(page,"Reloj del interrogatorio");
 await expect(page.getByTestId("rescate-clock")).toHaveAttribute("data-clock","done");
});

test("CASO M · pistas físicas, combinación 131026, cajón y sobre revelan cumpleaños",async({page})=>{
 test.setTimeout(140000);
 await page.goto("/rescate-mauro/?fecha=13%20de%20octubre&hora=20%3A00&lugar=La%20Plata");
 await page.getByRole("button",{name:/ACEPTAR MISIÓN/}).click();
 await expect(page.getByTestId("rescate-webgl")).toBeVisible();
 await walkTo(page,"w","z",-1.03);
 await examineNearby(page,"Grabador de voz");
 await expect(page.getByRole("dialog")).toContainText("10");
 await page.getByRole("button",{name:/GUARDAR EVIDENCIA/}).click();
 await expect(page.getByText(/PRUEBAS 1\/3/)).toBeVisible();
 await examineNearby(page,"Informe confidencial");
 await expect(page.getByRole("dialog")).toContainText("2026");
 await page.getByRole("button",{name:/GUARDAR EVIDENCIA/}).click();
 await walkTo(page,"a","x",-2.13);
 await walkTo(page,"w","z",-2.35);
 await examineNearby(page,"Fotografía dañada");
 await page.getByTestId("rescate-photo").getByRole("button",{name:/DAR VUELTA/}).click();
 await expect(page.getByRole("dialog")).toContainText("XIII");
 await page.getByRole("button",{name:/GUARDAR EVIDENCIA/}).click();
 await expect(page.getByText(/PRUEBAS 3\/3/)).toBeVisible();
 // Go around the front of the physical table (collision volumes prevent
 // reaching through the tabletop from the calendar side of the room).
 await walkTo(page,"s","z",-1.31,"above");
 await walkTo(page,"d","x",-1.13,"above");
 await expect.poll(async()=>{const n=page.getByTestId("rescate-webgl");return [Number(await n.getAttribute("data-camera-x")),Number(await n.getAttribute("data-camera-z"))];}).toEqual(expect.arrayContaining([expect.any(Number),expect.any(Number)]));
 await examineNearby(page,"Candado del cajón");
 const lock=page.getByTestId("rescate-lock");
 await expect(lock).toBeVisible();
 await page.getByRole("button",{name:"Subir cifra 1"}).click();
 for(let i=0;i<3;i++)await page.getByRole("button",{name:"Subir cifra 2"}).click();
 await page.getByRole("button",{name:"Subir cifra 3"}).click();
 for(let i=0;i<2;i++)await page.getByRole("button",{name:"Subir cifra 5"}).click();
 for(let i=0;i<6;i++)await page.getByRole("button",{name:"Subir cifra 6"}).click();
 await expect(lock.locator('strong[aria-label^="Cifra "]')).toHaveText(["1","3","1","0","2","6"]);
 await page.getByRole("button",{name:/PROBAR COMBINACIÓN/}).click();
 await expect(lock).not.toBeVisible();
 await expect(page.getByText(/EL CANDADO SE ABRIÓ/)).toBeVisible();
 await examineNearby(page,"Sobre encontrado");
 await page.getByRole("button",{name:/ROMPER EL SELLO/}).click();
 await expect(page.getByText(/TENÉS UNA INVITACIÓN/)).toBeVisible();
 await page.getByRole("button",{name:/ABRIR LA INVITACIÓN/}).click();
 const finale=page.getByTestId("rescate-invite-final");
 await expect(finale).toBeVisible();
 await expect(finale).toContainText("Mauro cumple años");
 await expect(finale).toContainText("13 de octubre");
 await expect(finale).toContainText("20:00");
 await expect(finale).toContainText("La Plata");
 await page.screenshot({path:"visual-qa-evidence/rescate-mauro-invitacion-revelada.png",fullPage:true});
});
