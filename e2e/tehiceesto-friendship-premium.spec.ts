import { expect, test } from "@playwright/test";

test("Amistad premium: nueve escenas, interacciones físicas y responsive móvil", async ({page},testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/amistad");
  const stage=page.locator("main.thi-experience");
  const scene=async (key:string)=>expect(stage).toHaveAttribute("data-scene",key);
  const noOverflow=async()=>expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
  const capture=async(name:string)=>testInfo.attach(name,{body:await page.screenshot({fullPage:true}),contentType:"image/png"});

  await scene("intro");
  await expect(page.locator(".friend-door-name")).toContainText("Vale");
  await expect(page.getByRole("heading",{name:/Algunas amistades no se explican/i})).toBeVisible();
  await noOverflow();
  await capture("amistad-01-puerta-mobile");
  await page.locator('[data-action="open-door"]').click();
  await scene("casefile");
  await expect(page.locator(".friend-case-folder")).toBeVisible();
  await page.locator('[data-action="casefile-open"]').click();
  await expect(page.locator(".friend-case-folder.open")).toBeVisible();
  await page.locator('.friend-case-scene [data-action="advance"]').click();
  await scene("memories");
  await expect(page.locator(".friend-polaroid")).toHaveCount(3);
  await noOverflow();
  await page.locator('.friend-memories [data-action="advance"]').click();

  await scene("insidejokes");
  await expect(page.locator(".friend-code-book")).toHaveCount(4);
  for(const i of [0,1,2])await page.locator('[data-action="insidejoke-open"]').nth(i).click();
  await expect(page.locator(".friend-code-book.open")).toHaveCount(3);
  await page.locator('.friend-codes [data-action="advance"]').click();

  await scene("incidents");
  await expect(page.locator(".friend-evidence-note")).toHaveCount(4);
  for(const i of [0,1,2])await page.locator('[data-action="incident-open"]').nth(i).click();
  await expect(page.locator(".friend-evidence-note.open")).toHaveCount(3);
  await noOverflow();
  await capture("amistad-05-tablero-mobile");
  await page.locator('.friend-incidents [data-action="advance"]').click();

  await scene("proof");
  for(const i of [0,1,2])await page.locator('[data-action="proof-open"]').nth(i).click();
  await expect(page.locator(".friend-presence-memory.is-lit")).toBeVisible();
  await noOverflow();
  await page.locator('.friend-presence [data-action="advance"]').click();

  await scene("letter");
  await expect(page.locator(".friend-envelope-wrap.open")).toHaveCount(0);
  await capture("amistad-07-sobre-cerrado-mobile");
  await page.locator('[data-action="letter-open"]').click();
  await expect(page.locator(".friend-envelope-wrap.open")).toHaveCount(1);
  await noOverflow();
  await capture("amistad-07-carta-abierta-mobile");
  await page.locator('.friend-letter-scene [data-action="advance"]').click();

  await scene("pact");
  for(const i of [0,1,2,3])await page.locator('[data-action="pact-open"]').nth(i).click();
  await expect(page.locator(".friend-clause.signed")).toHaveCount(4);
  await page.locator('.friend-pact-scene [data-action="advance"]').click();
  await expect(page.locator(".friend-pact-scene.fully-sealed")).toBeVisible();
  await noOverflow();
  await capture("amistad-08-pacto-firmado-mobile");
  await page.locator('.friend-pact-scene [data-action="advance"]').click();
  await scene("finale");
  await expect(page.locator(".friend-final-names")).toBeVisible();
  await noOverflow();
  await capture("amistad-09-final-mobile");

  await page.locator('[data-action="restart"]').last().click();
  await scene("intro");
});

test("Amistad premium: entrada y dossier en desktop sin desborde", async ({page},testInfo) => {
  test.setTimeout(35_000);
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/tehiceesto/experiencias/amistad");
  await expect(page.locator(".friend-door-name")).toContainText("Vale");
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
  await testInfo.attach("amistad-puerta-desktop",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});
  await page.locator('[data-action="open-door"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","casefile");
  await expect(page.locator(".friend-case-folder")).toBeVisible();
  await testInfo.attach("amistad-expediente-desktop",{body:await page.screenshot({fullPage:true}),contentType:"image/png"});
});
