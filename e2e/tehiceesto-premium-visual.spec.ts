import { mkdirSync } from "node:fs";
import { expect,test,type Page,type TestInfo } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./gift-flow";

async function capture(page:Page,testInfo:TestInfo,name:string){
  mkdirSync("visual-qa-evidence",{recursive:true});
  const path=`visual-qa-evidence/${name}.png`;
  await page.screenshot({path,fullPage:true});
  await testInfo.attach(name,{path,contentType:"image/png"});
}

test("Te Hice Esto premium rebuild visual contract",async({page},testInfo)=>{
  test.setTimeout(90_000);
  await page.emulateMedia({reducedMotion:"no-preference"});

  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/tehiceesto");
  await expect(page.getByRole("heading",{name:/Hay regalos que se abren una vez/i})).toBeVisible();
  await expect(page.getByRole("heading",{name:/¿Para quién lo estás haciendo\?/i})).toBeVisible();
  await expect(page.getByRole("link",{name:/Mamá/i})).toBeVisible();
  await expect(page.getByRole("link",{name:/Papá/i})).toBeVisible();
  await expect(page.getByRole("link",{name:/Amistad/i})).toBeVisible();
  await expect(page.getByRole("heading",{name:/No recibe una página/i})).toBeVisible();
  await expect(page.getByRole("heading",{name:/Mensajes que queremos guardar/i})).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-home-1440");

  await page.goto("/tehiceesto/crear");
  await expect(page.getByRole("heading",{name:/Elegí la que más se parece a/i})).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-creator-1440");

  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto");
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-home-390");

  await page.goto("/tehiceesto/crear");
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-creator-390");

  await page.goto("/tehiceesto/experiencias/pareja");
  await expect(page.getByText("Lo nuestro también merecía un lugar así.")).toBeVisible();
  await expect(page.getByText(/Ponete auriculares/i)).toHaveCount(0);
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-pareja-intro-390");
  await page.getByRole("button",{name:/Entrá despacio/i}).click();
  await expect(page.getByRole("heading",{name:/A veces empieza/i})).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await page.locator(".thi-pair-threshold-door").click();
  await expect(page.getByText("Del otro lado estamos nosotros.")).toBeVisible();
  await expect(page.getByRole("button",{name:/Seguir entrando/i})).toBeVisible();
  await expect.poll(async()=>{
    return page.locator(".thi-pair-threshold-leaf").evaluate((node)=>{
      const matrix=new DOMMatrix(getComputedStyle(node).transform);
      return Math.abs(matrix.m11);
    });
  }).toBeLessThan(.2);
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-pareja-threshold-390");

  await page.getByRole("button",{name:/Seguir entrando/i}).click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","memories");
  await page.locator('.thi-scene-memories [data-action="advance"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","voices");
  await page.locator('[data-action="demo-voice"]').first().click();
  await page.locator('[data-action="advance"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","light");
  await expect(page.getByRole("heading",{name:"Encontralo."})).toHaveCount(1);
  await expect(page.locator(".thi-light-photo-reveal img")).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  const lightReveal=page.locator(".thi-light-reveal-cinematic");
  await lightReveal.hover({position:{x:118,y:290}});
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-pareja-light-search-390");
  await lightReveal.click({position:{x:150,y:280}});
  await expect(page.getByText("No recuerdo exactamente qué dijimos. Sí recuerdo que no quería que terminara.")).toBeVisible();
  await expect(page.getByRole("button",{name:/Seguir con este recuerdo/i})).toBeVisible();
  await page.waitForTimeout(1250);
  await capture(page,testInfo,"tehiceesto-premium-pareja-light-revealed-390");

  await page.getByRole("button",{name:/Seguir con este recuerdo/i}).click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","stars");
  await expect(page.getByRole("heading",{name:/Hay cosas tuyas/i})).toBeVisible();
  await expect(page.locator(".floating-whatsapp--experience")).toBeHidden();
  await expect(page.locator(".thi-pair-star-node.is-active")).toHaveCount(1);
  await page.locator(".thi-pair-star-node.is-active").click();
  await expect(page.getByText(/Cómo hacés hogar/i)).toBeVisible();
  await page.locator(".thi-pair-star-node.is-active").click();
  await expect(page.getByText(/Tu risa cuando algo te causa gracia de verdad/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-pareja-constellation-progress-390");

  while(await page.locator(".thi-pair-star-node.is-active").count()){
    await page.locator(".thi-pair-star-node.is-active").click();
  }
  await expect(page.getByText("Ya estaban todas ahí.")).toBeVisible();
  await expect(page.getByText(/Cinco cosas tuyas que Julián no quería dejar sin decir/i)).toBeVisible();
  await expect(page.getByRole("button",{name:/Me las guardo/i})).toBeVisible();
  await capture(page,testInfo,"tehiceesto-premium-pareja-constellation-complete-390");

  for(const [slug,scene,openSelector] of [
    ["abuelos","archive",".archive-folder"],
    ["mama","childhood",null],
    ["propuesta","origin",null],
    ["amistad","casefile",".casefile-folder"],
  ] as const){
    await page.goto(`/tehiceesto/experiencias/${slug}`);
    await page.locator('[data-action="advance"]').click();
    await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene",scene);
    if(openSelector) await page.locator(openSelector).click();
    await page.waitForTimeout(350);
    await expectNoHorizontalOverflow(page);
    await capture(page,testInfo,`tehiceesto-premium-${slug}-390`);
  }

  await page.goto("/tehiceesto/experiencias/papa");
  await page.locator('[data-action="advance"]').click();
  await page.locator('[data-action="advance"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","lessons");
  await page.locator(".lesson-ledger button").nth(0).click();
  await page.locator(".lesson-ledger button").nth(1).click();
  await expectNoHorizontalOverflow(page);
  await capture(page,testInfo,"tehiceesto-premium-papa-390");
});
