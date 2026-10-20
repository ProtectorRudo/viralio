import {expect,test,type Page} from "@playwright/test";
import {mkdirSync} from "node:fs";

async function reachBirthdayWish(page:Page){
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>{throw Error("Mic disabled in deterministic QA")}}});
  });
  await page.goto("/tehiceesto/experiencias/cumpleanos");
  const main=page.locator("main.thi-experience");
  await expect(main).toHaveAttribute("data-scene","intro");
  await page.locator(".couple-gift-unseal").click();
  await expect(page.locator(".gift-phase-revealed")).toBeVisible({timeout:9000});
  await page.locator(".couple-gift-continue").click();
  await expect(main).toHaveAttribute("data-scene","candles");
  await page.locator('[data-action="blow-mic"]').click();
  await page.locator('[data-action="blow-fallback"]').dispatchEvent("click");
  await expect(page.locator(".thi-birthday-ritual")).toHaveClass(/out/);
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
  await expect(page.locator(".thi-birthday-wish-orb")).toBeVisible();
  await page.waitForTimeout(750);
}

for(const [label,width,height] of [["mobile",390,844],["small-mobile",360,700],["desktop",1440,960]] as const){
  test(`interactive crystal wish reaches emotional letter and next scene - ${label}`,async({page})=>{
    test.setTimeout(120000);
    await page.setViewportSize({width,height});
    const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
    await reachBirthdayWish(page);
    const scene=page.locator(".thi-birthday-wish-orb");
    await expect(scene.locator(".thi-wish-orb-header h2")).toContainText("Ahora nos toca a nosotros");
    await expect(scene.locator(".thi-wish-orb-instruction")).toContainText("Mantené presionada");
    await expect(page.locator(".thi-hold-reveal")).toHaveCount(0);
    const orb=page.locator('[data-action="hold"]');
    await expect(orb).toBeEnabled();
    await expect(page.locator('[data-action="advance"]')).toHaveCount(0);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(3);
    if(width<=650){
      const floater=page.locator(".floating-whatsapp--experience");
      if(await floater.count())await expect(floater).toBeHidden();
    }
    mkdirSync("birthday-orb-evidence",{recursive:true});
    await page.screenshot({path:`birthday-orb-evidence/${label}-unlit.png`,fullPage:false});
    const point=await orb.boundingBox();expect(point).toBeTruthy();
    await page.mouse.move(point!.x+point!.width/2,point!.y+point!.height/2);
    await page.mouse.down();
    await page.waitForTimeout(900);
    await page.mouse.up();
    await expect(page.locator('[data-wish-revealed="true"]')).toHaveCount(0);
    await expect(page.locator('[data-action="hold"]')).toBeEnabled();
    await orb.scrollIntoViewIfNeeded();
    const pt=await orb.boundingBox();expect(pt).toBeTruthy();
    await page.mouse.move(pt!.x+pt!.width/2,pt!.y+pt!.height/2);
    await page.mouse.down();
    await page.waitForTimeout(3280);
    await page.mouse.up();
    await expect(page.locator('[data-wish-revealed="true"]')).toBeVisible();
    await expect(scene.locator(".thi-wish-orb-message-lines")).toContainText("Que siempre tengas motivos para reírte así");
    const next=scene.locator('[data-action="advance"]');
    await expect(next).toBeVisible();
    await expect(next).toContainText("Guardar este deseo y continuar");
    await page.waitForTimeout(1050);
    await page.screenshot({path:`birthday-orb-evidence/${label}-revealed.png`,fullPage:false});
    const postOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(postOverflow).toBeLessThanOrEqual(3);
    await next.click();
    await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","letter");
    expect(errors).toEqual([]);
  });
}

test("birthday glass wish respects reduced-motion and works with accessibility fallback",async({page})=>{
  test.setTimeout(110000);
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:"reduce"});
  await reachBirthdayWish(page);
  const orb=page.locator(".thi-wish-orb-sphere");
  expect(await orb.evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
  await page.locator('[data-action="hold-accessible"]').click();
  await expect(page.locator('[data-wish-revealed="true"]')).toBeVisible();
  await expect(page.locator('[data-action="advance"]')).toBeVisible();
  await page.locator('.thi-wish-orb-continue').click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","letter");
});
