import {expect,test,type Page} from "@playwright/test";
import {mkdirSync} from "node:fs";

async function reachHugs(page:Page){
  await page.addInitScript(()=>Object.defineProperty(navigator,"mediaDevices",{
    configurable:true,value:{getUserMedia:async()=>{throw Error("Microphone unavailable during visual QA")}}
  }));
  await page.goto("/tehiceesto/experiencias/cumpleanos");
  const main=page.locator("main.thi-experience");
  await expect(main).toHaveAttribute("data-scene","intro");
  await page.locator(".couple-gift-unseal").click();
  await expect(page.locator(".gift-phase-revealed")).toBeVisible({timeout:9000});
  await page.locator(".couple-gift-continue").click();
  await expect(main).toHaveAttribute("data-scene","candles");
  await page.locator('[data-action="blow-mic"]').click();
  await page.locator('[data-action="blow-fallback"]').dispatchEvent("click");
  await page.locator(".thi-wish-continue").click();
  await expect(main).toHaveAttribute("data-scene","balloons");
  for(const i of [0,1,2])await page.locator('[data-action="balloon"]').nth(i).click();
  await page.locator(".thi-bday-balloon-continue").click();
  await expect(main).toHaveAttribute("data-scene","memories");
  await page.locator('.thi-scene-memories [data-action="advance"]').click();
  await expect(main).toHaveAttribute("data-scene","light");
  for(const i of [1,2,3])await page.locator(`[data-action="birthday-light-${i}"]`).click();
  await page.locator('[data-action="advance"]').click();
  await expect(main).toHaveAttribute("data-scene","voices");
  await page.locator(".thi-bday-voice-next").click();
  await expect(main).toHaveAttribute("data-scene","hold");
  await page.locator('[data-action="hold-accessible"]').click();
  await expect(page.locator('[data-wish-revealed="true"]')).toBeVisible();
  await page.locator(".thi-wish-orb-continue").click();
  await expect(main).toHaveAttribute("data-scene","hugs");
  await expect(page.locator(".thi-bday-hugs")).toBeVisible();
  await page.waitForTimeout(650);
}

for(const [mode,width,height] of [["mobile",390,844],["small-mobile",360,700],["desktop",1440,960]] as const){
  test(`birthday hugs reveal 100 hugs, five dedications and the letter at ${mode}`,async({page})=>{
    test.setTimeout(130_000);
    await page.setViewportSize({width,height});
    const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
    await reachHugs(page);
    const scene=page.locator(".thi-bday-hugs");
    await expect(page.locator(".thi-scene-meta")).toContainText("08 / 10");
    await expect(scene.locator("h2")).toContainText("Hay abrazos que querían llegar hasta vos");
    const titleBox=await scene.locator("h2").boundingBox();
    expect(titleBox).not.toBeNull();
    expect(titleBox!.y).toBeGreaterThanOrEqual(75);

    await expect(scene.locator(".thi-bday-hugs-ribbon")).toHaveCount(8);
    await expect(scene.locator(".thi-bday-hugs-callout")).toHaveCount(5);
    await expect(scene.locator(".thi-bday-hugs-center-badge")).toContainText("Para vos");
    await expect(page.locator('.thi-progress-next')).toBeDisabled();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(3);
    if(width<=650){
      const floating=page.locator(".floating-whatsapp--experience");
      if(await floating.count())await expect(floating).toBeHidden();
    }
    mkdirSync("birthday-hugs-evidence",{recursive:true});
    await page.screenshot({path:`birthday-hugs-evidence/${mode}-arrival.png`,fullPage:false});
    await page.locator('[data-action="receive-hugs"]').click();
    await expect(scene).toHaveClass(/is-receiving/);
    await expect(scene.locator(".thi-bday-hugs-progress")).toBeVisible();
    await expect(scene.locator(".thi-bday-hugs-callout.appeared").first()).toBeVisible();
    await page.waitForTimeout(1150);
    await page.screenshot({path:`birthday-hugs-evidence/${mode}-receiving.png`,fullPage:false});
    await page.locator('[data-action="receive-hugs"]').click();
    const counter=Number(await scene.getAttribute("data-hugs-count"));
    expect(counter).toBeGreaterThan(9);
    await page.locator('[data-action="finish-hugs"]').click();
    await expect(scene).toHaveAttribute("data-hugs-complete","true");
    await expect(scene.locator(".thi-bday-hugs-finale")).toContainText("Ojalá pudiéramos estar ahí");
    await expect(scene.locator(".thi-bday-hugs-continue")).toContainText("Abrir nuestra carta");
    await expect(page.locator('.thi-progress-next')).toBeEnabled();
    await page.waitForTimeout(800);
    await page.screenshot({path:`birthday-hugs-evidence/${mode}-complete.png`,fullPage:false});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(3);
    await page.locator(".thi-bday-hugs-continue").click();
    await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","letter");
    await expect(page.locator(".thi-birthday-letter-premium")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("birthday hug scene finishes naturally and respects reduced-motion setting",async({page})=>{
  test.setTimeout(130_000);
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:390,height:844});
  await reachHugs(page);
  const scene=page.locator(".thi-bday-hugs");
  const ribbon=scene.locator(".thi-bday-hugs-ribbon").first();
  expect(await ribbon.evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
  await page.locator('[data-action="receive-hugs"]').click();
  await expect(scene).toHaveAttribute("data-hugs-complete","true",{timeout:16_000});
  await expect(scene.locator(".thi-bday-hugs-continue")).toBeVisible();
  await page.locator(".thi-bday-hugs-continue").click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","letter");
});
