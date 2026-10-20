import {expect,test,type Page} from "@playwright/test";
import {mkdirSync} from "node:fs";

async function goToBirthdayVoices(page:Page){
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>{
      throw new Error("Microphone intentionally unavailable for test");
    }}});
  });
  await page.goto("/tehiceesto/experiencias/cumpleanos");
  const main=page.locator("main.thi-experience");
  await expect(main).toHaveAttribute("data-scene","intro");
  await page.locator(".couple-gift-unseal").click();
  await expect(page.locator(".gift-phase-revealed")).toBeVisible({timeout:10000});
  await page.locator(".couple-gift-continue").click();
  await expect(main).toHaveAttribute("data-scene","candles");
  await page.locator('[data-action="blow-mic"]').click();
  await page.locator('[data-action="blow-fallback"]').dispatchEvent("click");
  await expect(page.locator(".thi-birthday-ritual")).toHaveClass(/out/);
  await page.locator(".thi-wish-continue").click();
  await expect(main).toHaveAttribute("data-scene","balloons");
  const balloons=page.locator('[data-action="balloon"]');
  for(const n of [0,1,2])await balloons.nth(n).click();
  await page.locator('.thi-bday-balloon-continue').click();
  await expect(main).toHaveAttribute("data-scene","memories");
  await page.locator('.thi-scene-memories [data-action="advance"]').click();
  await expect(main).toHaveAttribute("data-scene","light");
  for(const n of [1,2,3])await page.locator(`[data-action="birthday-light-${n}"]`).click();
  await page.locator('[data-action="advance"]').click();
  await expect(main).toHaveAttribute("data-scene","voices");
}

for(const [name,width,height] of [["mobile",390,844],["small-mobile",360,700],["desktop",1440,960]] as const){
  test(`birthday voice cards preserve pause, resume and the original messages at ${name}`,async({page})=>{
    test.setTimeout(115000);
    const errors:string[]=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.setViewportSize({width,height});
    await goToBirthdayVoices(page);
    const scene=page.locator(".thi-bday-voice-scene");
    const cards=scene.locator(".thi-bday-voice-tile");
    await expect(cards).toHaveCount(4);
    await expect(cards.nth(0)).toContainText("Mamá");
    await expect(cards.nth(1)).toContainText("Nati");
    await expect(cards.nth(2)).toContainText("Fran");
    await expect(cards.nth(3)).toContainText("Los del grupo");
    const a=await cards.nth(0).boundingBox();
    const b=await cards.nth(1).boundingBox();
    expect(a).not.toBeNull();expect(b).not.toBeNull();
    expect(b!.y).toBeGreaterThan(a!.y+a!.height-4);
    await expect(scene.locator(".thi-bday-voice-waveform")).toHaveCount(4);
    await expect(scene.locator(".thi-bday-voice-waveform i")).toHaveCount(152);
    const nextReady=scene.locator('[data-action="advance"]');
    await expect(nextReady).toBeVisible();
    await expect(nextReady).toBeEnabled();
    await expect(nextReady).toContainText("Continuar con la sorpresa");
    if(width===390){
      // Persistent chapter arrows occupy the last ~65px of the viewport.
      // The primary CTA must not sit underneath them.
      const buttonBox=await nextReady.boundingBox();
      expect(buttonBox).not.toBeNull();
      expect(buttonBox!.y+buttonBox!.height).toBeLessThan(height-65);
    }
    await page.waitForTimeout(650);
    const header=await scene.locator("h2").boundingBox();
    expect(header).not.toBeNull();
    expect(header!.y).toBeGreaterThanOrEqual(80);
    const firstCard=await cards.nth(0).boundingBox();
    expect(firstCard!.y).toBeGreaterThan(header!.y+header!.height);

    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(3);
    if(width<=650){
      await expect(scene.locator(".thi-bday-voice-inline-cta")).toBeVisible();
      const globalCta=page.locator(".floating-whatsapp--experience");
      if(await globalCta.count())await expect(globalCta).toBeHidden();
    }
    mkdirSync("birthday-voices-evidence",{recursive:true});
    // A browser view transition snapshots the previous chapter; wait until
    // the transition completes before capturing the actual user viewport.
    await page.waitForTimeout(1300);
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:"instant"}));
    await page.waitForTimeout(200);
    await page.screenshot({path:`birthday-voices-evidence/${name}-idle.png`,fullPage:false});
    const play=scene.locator('[data-action="birthday-voice"]');
    await play.nth(0).click();
    await expect(cards.nth(0)).toHaveClass(/active/);
    await expect(scene.locator(".thi-bday-voice-player")).toBeVisible();
    await expect(scene.locator('[data-action="birthday-voice-toggle"]')).toBeVisible();
    await scene.locator('[data-action="birthday-voice-toggle"]').click();
    await expect(cards.nth(0)).toHaveClass(/active/);
    await play.nth(1).click();
    await expect(cards.nth(1)).toHaveClass(/active/);
    await expect(cards.nth(0)).not.toHaveClass(/active/);
    await expect(scene.locator(".thi-bday-voice-next")).toBeVisible();
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:"instant"}));
    await page.waitForTimeout(400);
    await page.screenshot({path:`birthday-voices-evidence/${name}-selected.png`,fullPage:false});
    await scene.locator(".thi-bday-voice-next").click();
    await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","hold");
    expect(errors).toEqual([]);
  });
}
test("voice cards keep reduced-motion preference and do not invent audio duration",async({page})=>{
  test.setTimeout(100000);
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:"reduce"});
  await goToBirthdayVoices(page);
  const scene=page.locator(".thi-bday-voice-scene");
  await expect(scene.locator(".thi-bday-voice-meta small").first()).toContainText("MENSAJE 01");
  await scene.locator('[data-action="birthday-voice"]').first().click();
  const wave=scene.locator(".thi-bday-voice-waveform i").first();
  expect(await wave.evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
  await expect(scene.locator(".thi-bday-voice-player")).toBeVisible();
});

test("birthday voices always have a visible functional continue button, even before listening",async({page})=>{
  test.setTimeout(110000);
  await page.setViewportSize({width:390,height:844});
  await goToBirthdayVoices(page);
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","voices");
  const next=page.locator(".thi-bday-voice-next");
  await expect(next).toBeVisible();
  await expect(next).toBeEnabled();
  await expect(next).toContainText("Continuar con la sorpresa");
  await next.click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","hold");
});
