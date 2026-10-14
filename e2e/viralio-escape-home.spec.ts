import { mkdirSync } from "node:fs";
mkdirSync("visual-qa-evidence",{recursive:true});
import { test, expect } from "@playwright/test";

test("Viralio Escape: catalogue exposes the three real rooms and clear navigation", async ({page}) => {
 await page.goto("/");
 await expect(page.getByRole("heading",{level:1,name:/La realidad termina/})).toBeVisible();
 await page.screenshot({path:"visual-qa-evidence/viralio-escape-desktop.png",fullPage:true});
 for (const [slug,title] of [["caso-m","CASO M"],["la-ultima-funcion","LA ÚLTIMA FUNCIÓN"],["la-ultima-campanada","LA ÚLTIMA CAMPANADA"]]){
   await expect(page.getByRole("link",{name:new RegExp("Conocer la experiencia "+title)})).toHaveAttribute("href","/salas/"+slug);
 }
 await expect(page.getByRole("link",{name:/Explorar experiencias/i}).first()).toHaveAttribute("href","#experiencias");
});
test("Viralio Escape: filters never invent rooms and allow returning to available games",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:"Misterio",exact:true}).click();
 await expect(page.getByRole("heading",{name:/Algo nuevo está por abrirse/})).toBeVisible();
 await page.getByRole("button",{name:/Ver experiencias disponibles/}).click();
 await expect(page.locator(".ve-card")).toHaveCount(3);
 await page.getByRole("button",{name:"Emociones",exact:true}).click();
 await expect(page.locator(".ve-card")).toHaveCount(1);
 await expect(page.getByRole("link",{name:/Conocer la experiencia LA ÚLTIMA CAMPANADA/})).toBeVisible();
});
test("Viralio Escape: all 3 product pages contain verified destination URLs",async({page})=>{
 const pairs=[
  ["caso-m","https://tehiceesto.com/escape-play/caso-m/"],
  ["la-ultima-funcion","https://la-ultima-funcion.vercel.app/"],
  ["la-ultima-campanada","https://la-ultima-campanada-desafio-v6.vercel.app/"]
 ];
 for(const [slug,dest] of pairs){
  await page.goto("/salas/"+slug);
  await expect(page.getByRole("link",{name:/Jugar experiencia/i})).toHaveAttribute("href",dest);
  await expect(page.getByRole("link",{name:/Entrar a la sala/i})).toHaveAttribute("href",dest);
 }
});
test("Viralio Escape: no horizontal scroll from narrow phone through desktop",async({page})=>{
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:812});
  await page.goto("/");
  const {clientWidth,scrollWidth}=await page.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
  expect(scrollWidth, "horizontal overflow at "+width+"px").toBeLessThanOrEqual(clientWidth+1);
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  if(width===390)await page.screenshot({path:"visual-qa-evidence/viralio-escape-mobile.png",fullPage:true});
 }
});
test("Legacy commerce landing remains in /comercios and QR merchant routes untouched",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/comercios");
 await expect(page.getByRole("heading",{name:/Dale a tus clientes una razón para volver/})).toBeVisible();
 await expect(page.getByRole("link",{name:/Moka/})).toHaveAttribute("href","/moka");
 await page.goto("/moka");
 await expect(page).not.toHaveURL(/404/);
});
