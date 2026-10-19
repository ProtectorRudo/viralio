import {expect,test, type Page} from "@playwright/test";
import {mkdirSync} from "node:fs";

async function openBirthdayBalloons(page:Page){
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{
      getUserMedia:async()=>{throw new Error("Mic deliberately denied for deterministic visual test");}
    }});
  });
  const response=await page.goto("/tehiceesto/experiencias/cumpleanos");
  expect(response?.status()).toBe(200);
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","intro");
  await page.locator(".couple-gift-unseal").click();
  await expect(page.locator(".gift-phase-revealed")).toBeVisible({timeout:9000});
  await page.locator(".couple-gift-continue").click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","candles");
  await page.locator('[data-action="blow-mic"]').click();
  await page.locator('[data-action="blow-fallback"]').click();
  await expect(page.locator('.thi-birthday-ritual')).toHaveClass(/out/);
  await page.locator('[data-action="advance"]').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","balloons");
  await expect(page.locator(".thi-bday-balloon-scene")).toBeVisible();
  await page.waitForTimeout(750);
}

for(const [name,width,height] of [["mobile",390,844],["small-mobile",360,700],["desktop",1440,960]] as const){
 test(`premium birthday balloons limit to 3 and reveal personal notes on ${name}`,async({page})=>{
  await page.setViewportSize({width,height});
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await openBirthdayBalloons(page);
  const balloons=page.locator(".thi-bday-balloon-btn");
  await expect(balloons).toHaveCount(6);
  await expect(page.locator(".thi-bday-satin-body")).toHaveCount(6);
  await expect(page.locator('.thi-bday-balloon-btn i')).not.toContainText(["TOCÁ"]);
  const next=page.locator('[data-action="advance"]');
  await expect(next).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(3);
  mkdirSync("birthday-balloons-evidence",{recursive:true});
  await page.screenshot({path:`birthday-balloons-evidence/${name}-closed.png`});
  for(const i of [4,0,2]){
    await balloons.nth(i).click();
    await expect(balloons.nth(i)).toHaveClass(/pop/);
    await expect(balloons.nth(i).locator(".thi-bday-reveal-note")).toBeVisible();
  }
  await expect(page.locator(".thi-bday-balloon-btn.pop")).toHaveCount(3);
  await expect(page.locator(".thi-bday-progress-jewels .lit")).toHaveCount(3);
  await expect(page.locator(".thi-bday-balloon-btn.is-locked")).toHaveCount(3);
  for(const i of [1,3,5]) await expect(balloons.nth(i)).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(page.locator(".thi-birthday-balloons-count")).toContainText("tres sorpresas");
  await page.waitForTimeout(850);
  await page.screenshot({path:`birthday-balloons-evidence/${name}-selected.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(3);
  await next.click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","memories");
  expect(errors).toEqual([]);
 });
}

test("six simultaneous user clicks cannot unlock more than three birthday balloons",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openBirthdayBalloons(page);
 // Dispatch in the same JavaScript event-loop turn, before React state commits.
 await page.locator(".thi-bday-satin-gallery").evaluate(root=>{
   root.querySelectorAll<HTMLButtonElement>('[data-action="balloon"]').forEach(button=>button.click());
 });
 await expect(page.locator(".thi-bday-balloon-btn.pop")).toHaveCount(3);
 await expect(page.locator(".thi-bday-balloon-btn.is-locked")).toHaveCount(3);
 await expect(page.locator(".thi-bday-progress-jewels .lit")).toHaveCount(3);
 await expect(page.locator('[data-action="advance"]')).toBeEnabled();
});

test("reduced-motion birthday balloons reveal messages without animations",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.setViewportSize({width:390,height:844});
 await openBirthdayBalloons(page);
 const balloon=page.locator(".thi-bday-balloon-btn").first();
 await balloon.click();
 await expect(balloon.locator(".thi-bday-reveal-note")).toHaveCSS("opacity","1");
 expect(await balloon.locator(".thi-bday-satin-body").evaluate(e=>getComputedStyle(e).animationName)).toBe("none");
});
