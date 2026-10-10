import {test,expect,type Page} from "@playwright/test";
import {mkdirSync} from "node:fs";

mkdirSync("visual-qa-evidence",{recursive:true});
async function start(page:Page){
 await page.goto("/rescate-mauro/");
 await expect(page.getByRole("heading",{name:/SECUESTRARON/})).toBeVisible();
 await page.getByRole("button",{name:/ACEPTAR MISIÓN/}).click();
 await expect(page.getByTestId("rescate-mauro-app")).toHaveAttribute("data-stage","game");
 const canvas=page.getByTestId("rescate-webgl");
 await expect(canvas).toBeVisible();
 await expect.poll(()=>canvas.evaluate((n)=>{
  const c=n as HTMLCanvasElement;
  const gl=c.getContext("webgl");
  return Boolean(gl&&c.width>200&&c.height>200&&gl.getParameter(gl.VERSION).includes("WebGL"));
 })).toBe(true);
 await expect(page.getByTestId("rescate-timer")).toContainText("03:00");
}
async function walk(page:Page,key:string,ms:number){
 await page.keyboard.down(key);
 await page.waitForTimeout(ms);
 await page.keyboard.up(key);
}
async function examineNearby(page:Page,name:string){
 const nearby=page.getByTestId("rescate-nearby");
 if(!(await nearby.isVisible()))await page.getByRole("button",{name:/EXPLORAR ALREDEDOR/}).click();
 await expect(nearby).toBeVisible();
 await nearby.getByRole("button",{name:new RegExp(name,"i")}).click();
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

test("CASO M · pistas físicas, combinación 1310, cajón y sobre revelan cumpleaños",async({page})=>{
 test.setTimeout(110000);
 await page.goto("/rescate-mauro/?fecha=13%20de%20octubre&hora=20%3A00&lugar=La%20Plata");
 await page.getByRole("button",{name:/ACEPTAR MISIÓN/}).click();
 await expect(page.getByTestId("rescate-webgl")).toBeVisible();
 await walk(page,"w",2050);
 await examineNearby(page,"Grabador de voz");
 await expect(page.getByRole("dialog")).toContainText("10");
 await page.getByRole("button",{name:/GUARDAR EVIDENCIA/}).click();
 await expect(page.getByText(/PRUEBAS 1\/3/)).toBeVisible();
 await examineNearby(page,"Informe confidencial");
 await expect(page.getByRole("dialog")).toContainText("DÍA");
 await page.getByRole("button",{name:/GUARDAR EVIDENCIA/}).click();
 await walk(page,"a",850);
 await walk(page,"w",1050);
 await examineNearby(page,"Calendario arrancado");
 await expect(page.getByRole("dialog")).toContainText("13");
 await page.getByRole("button",{name:/GUARDAR EVIDENCIA/}).click();
 await expect(page.getByText(/PRUEBAS 3\/3/)).toBeVisible();
 await examineNearby(page,"Candado del cajón");
 const lock=page.getByTestId("rescate-lock");
 await expect(lock).toBeVisible();
 await page.getByRole("button",{name:"Subir cifra 1"}).click();
 for(let i=0;i<3;i++)await page.getByRole("button",{name:"Subir cifra 2"}).click();
 await page.getByRole("button",{name:"Subir cifra 3"}).click();
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
