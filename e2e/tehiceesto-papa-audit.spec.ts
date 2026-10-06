import { mkdirSync } from "node:fs";
import { expect,test,type Page,type TestInfo } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./gift-flow";

async function capture(page:Page,testInfo:TestInfo,name:string){
  mkdirSync("visual-qa-evidence",{recursive:true});
  const path=`visual-qa-evidence/${name}.png`;
  await page.screenshot({path,fullPage:true});
  await testInfo.attach(name,{path,contentType:"image/png"});
}

async function auditScene(page:Page,testInfo:TestInfo,name:string){
  await expectNoHorizontalOverflow(page);
  await page.waitForTimeout(220);
  await capture(page,testInfo,`audit-papa-${name}-390`);
}

test("audit visual completo de Papá",async({page},testInfo)=>{
  test.setTimeout(90_000);
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.setViewportSize({width:390,height:844});

  await page.goto("/tehiceesto/experiencias/papa");
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","intro");
  await auditScene(page,testInfo,"01-intro");

  await page.locator('[data-action="advance"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","memories");
  await auditScene(page,testInfo,"02-memories");

  await page.locator('[data-action="advance"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","lessons");
  await auditScene(page,testInfo,"03-lessons-closed");
  for(const i of [0,1,2]) await page.locator(".lesson-ledger button").nth(i).click();
  await auditScene(page,testInfo,"03-lessons-open");
  await page.locator('[data-action="advance"]').click();

  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","presence");
  await auditScene(page,testInfo,"04-presence-closed");
  for(const i of [0,1]) await page.locator(".presence-track button").nth(i).click();
  await auditScene(page,testInfo,"04-presence-open");
  await page.locator('[data-action="advance"]').click();

  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","inheritance");
  await auditScene(page,testInfo,"05-inheritance-closed");
  for(const i of [0,1,2]) await page.locator(".inheritance-board button").nth(i).click();
  await auditScene(page,testInfo,"05-inheritance-open");
  await page.locator('[data-action="advance"]').click();

  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","voices");
  await auditScene(page,testInfo,"06-voices-closed");
  const voices=page.locator('.thi-voices [data-action="demo-voice"]');
  for(let i=0;i<await voices.count();i++) await voices.nth(i).click();
  await auditScene(page,testInfo,"06-voices-open");
  await page.locator('[data-action="advance"]').click();

  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","letter");
  await auditScene(page,testInfo,"07-letter-closed");
  await page.locator('[data-action="open-letter"]').click();
  await auditScene(page,testInfo,"07-letter-open");
  await page.locator('[data-action="advance"]').click();

  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","lookback");
  await auditScene(page,testInfo,"08-lookback-closed");
  await page.locator('[data-action="lookback-open"]').click();
  await auditScene(page,testInfo,"08-lookback-open");
  await page.locator('[data-action="advance"]').click();

  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","finale");
  await auditScene(page,testInfo,"09-finale");
});
