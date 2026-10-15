import { mkdirSync } from "node:fs";
mkdirSync("visual-qa-evidence",{recursive:true});
import { test, expect } from "@playwright/test";

test("Viralio Escape: catalogue exposes all four real rooms, editorial intensity and clear navigation", async ({page}) => {
 await page.goto("/");
 await expect(page.getByRole("heading",{level:1,name:/La realidad termina/})).toBeVisible();
 await page.screenshot({path:"visual-qa-evidence/viralio-escape-desktop.png",fullPage:true});
 for (const [slug,title] of [["caso-m","CASO M"],["la-ultima-funcion","LA ÚLTIMA FUNCIÓN"],["la-ultima-campanada","LA ÚLTIMA CAMPANADA"],["aislamiento-15","AISLAMIENTO 15"]]){
   await expect(page.getByRole("link",{name:new RegExp("Conocer la experiencia "+title)})).toHaveAttribute("href","/salas/"+slug);
 }
 await expect(page.getByRole("link",{name:"Probar gratis",exact:true}).first()).toHaveAttribute("href","/probar");
 const grid=page.locator(".ve-card-grid");
 await expect(grid.locator(".ve-card")).toHaveCount(4);
 for(const key of ["Dificultad","Sustos","Sorpresa","Tensión"]){
   await expect(grid.locator(".ve-intensity-metric-name",{hasText:key})).toHaveCount(4);
 }
 for(const card of await grid.locator(".ve-card").all()){
   await expect(card.locator(".ve-intensity-metric")).toHaveCount(4);
   await expect(card.locator(".ve-intensity-segment")).toHaveCount(20);
 }
});
test("Viralio Escape: filters never invent rooms and allow returning to available games",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:"Misterio",exact:true}).click();
 await expect(page.getByRole("heading",{name:/Algo nuevo está por abrirse/})).toBeVisible();
 await page.getByRole("button",{name:/Ver experiencias disponibles/}).click();
 await expect(page.locator(".ve-card")).toHaveCount(4);
 await page.getByRole("button",{name:"Emociones",exact:true}).click();
 await expect(page.locator(".ve-card")).toHaveCount(1);
 await expect(page.getByRole("link",{name:/Conocer la experiencia LA ÚLTIMA CAMPANADA/})).toBeVisible();
});
test("Viralio Escape: all 4 product pages contain verified destination URLs and intensity profiles",async({page})=>{
 const pairs=[
  ["caso-m","https://tehiceesto.com/escape-play/caso-m/"],
  ["la-ultima-funcion","https://la-ultima-funcion.vercel.app/"],
  ["la-ultima-campanada","https://la-ultima-campanada-desafio-v6.vercel.app/"],
  ["aislamiento-15","https://protectorrudo.github.io/aislamiento-15/"]
 ];
 for(const [slug,dest] of pairs){
  await page.goto("/salas/"+slug);
  await expect(page.getByRole("link",{name:/Jugar gratis durante las pruebas/i})).toHaveAttribute("href",dest);
  await expect(page.getByRole("link",{name:"Jugar gratis",exact:true})).toHaveAttribute("href",dest);
  const meter=page.locator(".ve-room-panel .ve-intensity-detail");
  await expect(meter).toBeVisible();
  await expect(meter.locator(".ve-intensity-metric")).toHaveCount(4);
  await expect(page.getByText(/Intensidades orientativas definidas por el equipo/)).toBeVisible();
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

test("Viralio Escape: 1-to-5 editorial profiles are differentiated and never mimic user ratings",async({page})=>{
 await page.goto("/");
 const entries=[
  {slug:"caso-m",metrics:[3,3,3,4]},
  {slug:"la-ultima-funcion",metrics:[3,4,4,4]},
  {slug:"la-ultima-campanada",metrics:[3,1,5,3]},
  {slug:"aislamiento-15",metrics:[4,5,4,5]}
 ];
 for(const entry of entries){
  const link=page.getByRole("link",{name:new RegExp("Conocer la experiencia")}).filter({has:page.locator(`.ve-card-content h3`,{hasText:entry.slug==="caso-m"?"CASO M":entry.slug==="aislamiento-15"?"AISLAMIENTO 15":entry.slug==="la-ultima-funcion"?"LA ÚLTIMA FUNCIÓN":"LA ÚLTIMA CAMPANADA"})});
  const meters=link.locator(".ve-intensity-metric");
  await expect(meters).toHaveCount(4);
  for(const [i,score] of entry.metrics.entries()){
   await expect(meters.nth(i).locator(".ve-intensity-segment.is-filled")).toHaveCount(score);
  }
 }
 await expect(page.getByText(/Intensidades editoriales orientativas/)).toBeVisible();
 await expect(page.getByText(/puntuaciones de usuarios/)).toBeVisible();
});

test("Viralio Escape: genuine video teaser is playable on the catalogue and hospital detail page",async({page})=>{
  const url="https://protectorrudo.github.io/aislamiento-15/media/trailer-real.mp4";
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/No te mostramos/})).toBeVisible();
  await expect(page.locator(".ve-realfilm-video source")).toHaveAttribute("src",url);
  await expect(page.locator(".ve-realfilm-video")).toHaveAttribute("preload","none");
  await expect(page.getByText(/MATERIAL CAPTURADO EN EL JUEGO REAL/)).toBeVisible();
  await page.goto("/salas/aislamiento-15");
  await expect(page.locator(".ve-realfilm-video source")).toHaveAttribute("src",url);
  await expect(page.getByRole("link",{name:/Jugar gratis durante las pruebas/})).toHaveAttribute(
    "href","https://protectorrudo.github.io/aislamiento-15/");
});
test("Viralio Escape: transparent free playable trial requires no account or payment",async({page})=>{
  for(const width of [360,390,768,1440]){
    await page.setViewportSize({width,height:844});
    await page.goto("/probar");
    await expect(page.getByRole("heading",{level:1,name:/Antes de creerlo/})).toBeVisible();
    await expect(page.getByRole("link",{name:/Empezar la prueba gratis/})).toHaveAttribute(
      "href","https://protectorrudo.github.io/aislamiento-15/");
    await expect(page.getByText(/Actualmente se puede jugar la experiencia completa sin pagar/)).toBeVisible();
    await expect(page.locator(".ve-realfilm-video")).toHaveCount(1);
    const overflow=await page.evaluate(()=>({
      width:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth
    }));
    expect(overflow.scroll,"/probar should never scroll horizontally at "+width)
      .toBeLessThanOrEqual(overflow.width+1);
  }
});
