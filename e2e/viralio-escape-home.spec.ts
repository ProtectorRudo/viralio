import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";
mkdirSync("visual-qa-evidence", { recursive: true });

const rooms = [
  { slug: "caso-m", name: "CASO M", remote: "tehiceesto.com/escape-play/caso-m" },
  { slug: "la-ultima-funcion", name: "LA ÚLTIMA FUNCIÓN", remote: "la-ultima-funcion.vercel.app" },
  { slug: "la-ultima-campanada", name: "LA ÚLTIMA CAMPANADA", remote: "la-ultima-campanada-desafio-v6.vercel.app" },
  { slug: "aislamiento-15", name: "AISLAMIENTO 15", remote: "protectorrudo.github.io/aislamiento-15" },
];

async function expectNoFreeTrialOrTrailer(page: import("@playwright/test").Page) {
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/(?:probar gratis|prueba gratuita|jugar gratis|ver tr[aá]iler|tr[aá]iler real|material capturado en el juego real)/i);
  expect(await page.locator("video, iframe[src*='trailer'], a[href='/probar'], a[href='#trailer']").count()).toBe(0);
}

test("Viralio Escape: four rooms remain accessible as product pages without trailers or free promotion", async ({page}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /La realidad termina/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explorar experiencias/ }).first()).toHaveAttribute("href", "#experiencias");
  await expectNoFreeTrialOrTrailer(page);
  await page.screenshot({path:"visual-qa-evidence/viralio-escape-desktop.png",fullPage:true});
  for (const room of rooms) {
    await expect(page.getByRole("link", { name: new RegExp("Conocer la experiencia "+room.name) }))
      .toHaveAttribute("href", "/salas/"+room.slug);
  }
  const grid = page.locator(".ve-card-grid");
  await expect(grid.locator(".ve-card")).toHaveCount(4);
  for (const key of ["Dificultad","Sustos","Sorpresa","Tensión"]) {
    await expect(grid.locator(".ve-intensity-metric-name", { hasText:key })).toHaveCount(4);
  }
});
test("Viralio Escape: detail pages preserve gameplay descriptions but have no free or direct play links", async ({page}) => {
  for(const room of rooms) {
    await page.goto("/salas/"+room.slug);
    await expect(page.getByRole("heading", { level:1, name:room.name })).toBeVisible();
    await expect(page.getByText("Acceso individual próximamente.")).toBeVisible();
    await expect(page.locator(".ve-room-panel .ve-intensity-detail .ve-intensity-metric")).toHaveCount(4);
    await expectNoFreeTrialOrTrailer(page);
    const links=await page.locator("a[href]").evaluateAll((nodes) => nodes.map(node => (node as HTMLAnchorElement).href));
    expect(links.some(url => url.includes(room.remote)), "No immediate unrestricted direct game link for "+room.slug).toBe(false);
    await expect(page.getByRole("link",{name:/Consultar experiencias para regalar/})).toHaveAttribute("href","https://tehiceesto.com/#escapes");
  }
});
test("Viralio Escape: retired /probar no longer offers free games",async({page})=>{
  await page.goto("/probar");
  await expect(page).toHaveURL(/\/#experiencias$/);
  await expect(page.getByRole("heading",{level:1,name:/La realidad termina/})).toBeVisible();
  await expectNoFreeTrialOrTrailer(page);
});
test("Viralio Escape: interactive category filters still work with all four games", async ({page})=>{
  await page.goto("/");
  await page.getByRole("button", { name:"Misterio",exact:true }).click();
  await expect(page.getByRole("heading",{name:/Algo nuevo está por abrirse/})).toBeVisible();
  await page.getByRole("button",{name:/Ver experiencias disponibles/}).click();
  await expect(page.locator(".ve-card")).toHaveCount(4);
  await page.getByRole("button",{name:"Emociones",exact:true}).click();
  await expect(page.locator(".ve-card")).toHaveCount(1);
});
test("Viralio Escape: desktop and 320px mobile show no horizontal overflow", async ({page})=>{
  for (const width of [320,360,390,430,768,1024,1440]) {
    await page.setViewportSize({width,height:812});
    await page.goto("/");
    const {clientWidth,scrollWidth}=await page.evaluate(()=>({
      clientWidth:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth
    }));
    expect(scrollWidth, "overflow at "+width+"px").toBeLessThanOrEqual(clientWidth+1);
    await expect(page.getByRole("heading",{level:1})).toBeVisible();
    if(width===390) await page.screenshot({path:"visual-qa-evidence/viralio-escape-mobile.png",fullPage:true});
  }
});
test("Existing QR merchant landing remains intact on /comercios", async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/comercios");
  await expect(page.getByRole("heading",{name:/Dale a tus clientes una razón para volver/})).toBeVisible();
  await expect(page.getByRole("link",{name:/Moka/})).toHaveAttribute("href","/moka");
  await page.goto("/moka");
  await expect(page).not.toHaveURL(/404/);
});
