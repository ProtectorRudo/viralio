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
  await expect(page.getByRole("heading",{name:/No le mandes/i})).toBeVisible();
  await expect(page.getByRole("heading",{name:/Nueve historias/i})).toBeVisible();
  await expect(page.getByText("Todo lo que hiciste sin pedir aplausos")).toBeVisible();
  await expect(page.getByText("Las cosas tuyas que quedaron en mí")).toBeVisible();
  await expect(page.getByText("Expediente: nuestra amistad")).toBeVisible();
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
