import { expect,test } from "@playwright/test";
import { mkdirSync } from "node:fs";

for(const [label,width,height] of [["mobile",390,844],["desktop",1440,960],["small-mobile",360,700]] as const){
 test(`birthday wish cake remains premium, blows out and preserves balloons: ${label}`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>{throw new Error("Permission denied for controlled test")}}});
  });
  const jsErrors:string[]=[];
  page.on("pageerror",error=>jsErrors.push(error.message));
  await page.goto("/tehiceesto/experiencias/cumpleanos");
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","intro");
  await page.locator(".birthday-gift-wrap .couple-gift-unseal").click();
  await expect(page.locator(".birthday-gift-wrap .gift-phase-revealed")).toBeVisible({timeout:8000});
  await page.locator(".birthday-gift-wrap [data-action='advance']").click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","candles");
  const scene=page.locator(".thi-birthday-wish");
  await expect(scene).toBeVisible();
  await page.waitForTimeout(1400); // capture settled scene, not an intro view-transition frame
  await expect(scene.locator(".thi-wish-cake-art")).toBeVisible();
  await expect(scene.locator(".thi-wish-candle")).toHaveCount(5);
  await expect(scene.locator(".thi-wish-flame")).toHaveCount(5);
  await expect(scene.getByText("Pedí un deseo.")).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(3);
  const visual=await scene.evaluate(el=>{
    const svg=el.querySelector(".thi-wish-cake-art")!.getBoundingClientRect();
    const h=el.querySelector("h2")!.getBoundingClientRect();
    const button=el.querySelector(".thi-blow-mic")!.getBoundingClientRect();
    return {svg:svg.toJSON(),headline:h.toJSON(),button:button.toJSON(),vw:innerWidth};
  });
  expect(visual.svg.width).toBeGreaterThan(Math.min(310,width*.75));
  expect(visual.button.width).toBeGreaterThanOrEqual(180);
  expect(visual.svg.bottom).toBeLessThan(visual.button.bottom+30);
  mkdirSync("birthday-wish-evidence",{recursive:true});
  await page.screenshot({path:`birthday-wish-evidence/${label}-lit.png`,fullPage:false});
  await page.locator("[data-action='blow-mic']").click();
  await expect(page.locator("[data-action='blow-fallback']")).toBeVisible();
  await page.locator("[data-action='blow-fallback']").click();
  await expect(page.locator(".thi-birthday-ritual")).toHaveClass(/out/);
  await expect(page.locator(".thi-wish-flame").first()).toHaveCSS("opacity","0");
  await page.waitForTimeout(650);
  const after=await scene.locator("h2").boundingBox();
  expect(after).not.toBeNull();
  expect(after!.y).toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(()=>window.scrollY)).toBeLessThanOrEqual(3);
  await expect(page.locator("[data-action='advance']")).toBeVisible();
  await page.screenshot({path:`birthday-wish-evidence/${label}-out.png`,fullPage:false});
  await page.locator("[data-action='advance']").click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","balloons");
  expect(jsErrors).toEqual([]);
 });
}

test("reduced-motion birthday wish retains accessible blow and smoke state",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.setViewportSize({width:390,height:844});
 await page.goto("/tehiceesto/experiencias/cumpleanos");
 await page.locator(".couple-gift-unseal").click();
 await page.locator(".couple-gift-continue").click();
 await expect(page.locator(".thi-wish-cake-art")).toBeVisible();
 const animated=await page.locator(".thi-wish-flame").first().evaluate(el=>getComputedStyle(el).animationName);
 expect(animated).toBe("none");
});
