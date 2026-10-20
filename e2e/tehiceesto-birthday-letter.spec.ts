import {expect,test,type Page} from "@playwright/test";
import {mkdirSync} from "node:fs";

async function reachLetter(page:Page){
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>{throw Error("No microphone during letter QA")}}});
  });
  await page.goto("/tehiceesto/experiencias/cumpleanos");
  const stage=page.locator("main.thi-experience");
  await expect(stage).toHaveAttribute("data-scene","intro");
  await page.locator(".couple-gift-unseal").click();
  await expect(page.locator(".gift-phase-revealed")).toBeVisible({timeout:9000});
  await page.locator(".couple-gift-continue").click();
  await page.locator('[data-action="blow-mic"]').click();
  await page.locator('[data-action="blow-fallback"]').dispatchEvent("click");
  await page.locator(".thi-wish-continue").click();
  await expect(stage).toHaveAttribute("data-scene","balloons");
  for(const i of [0,1,2])await page.locator('[data-action="balloon"]').nth(i).click();
  await page.locator(".thi-bday-balloon-continue").click();
  await expect(stage).toHaveAttribute("data-scene","memories");
  await page.locator('.thi-scene-memories [data-action="advance"]').click();
  await expect(stage).toHaveAttribute("data-scene","light");
  for(const i of [1,2,3])await page.locator(`[data-action="birthday-light-${i}"]`).click();
  await page.locator('[data-action="advance"]').click();
  await expect(stage).toHaveAttribute("data-scene","voices");
  await page.locator(".thi-bday-voice-next").click();
  await expect(stage).toHaveAttribute("data-scene","hold");
  await page.locator('[data-action="hold-accessible"]').click();
  await expect(page.locator('[data-wish-revealed="true"]')).toBeVisible();
  await page.locator(".thi-wish-orb-continue").click();
  await expect(stage).toHaveAttribute("data-scene","hugs");
  await page.locator('[data-action="receive-hugs"]').click();
  await page.locator('[data-action="finish-hugs"]').click();
  await expect(page.locator('[data-hugs-complete="true"]')).toBeVisible();
  await page.locator(".thi-bday-hugs-continue").click();
  await expect(stage).toHaveAttribute("data-scene","letter");
  await page.waitForTimeout(850);
}

for(const [mode,width,height] of [["mobile",390,844],["small-mobile",360,700],["desktop",1440,960]] as const){
  test(`Birthday keepsake envelope opens and preserves personalized letter — ${mode}`,async({page})=>{
    test.setTimeout(125000);
    const pageErrors:string[]=[];page.on("pageerror",e=>pageErrors.push(e.message));
    await page.setViewportSize({width,height});
    await reachLetter(page);
    const stage=page.locator("main.thi-experience");
    const scene=page.locator(".thi-birthday-letter-premium");
    const envelope=scene.locator('[data-action="open-letter"]');
    const wax=envelope.locator(".wax");
    await expect(scene).toBeVisible();
    await expect(scene.locator("h2")).toContainText("Hay cosas que merecen");
    await expect(envelope).not.toHaveClass(/open/);
    await expect(wax).toBeVisible();
    await expect(scene.locator(".thi-hint")).toContainText("Tocá el sello");
    await expect(scene.locator(".thi-letter-continue")).toHaveCount(0);
    const beauty=await envelope.evaluate(el=>{
      const flap=el.querySelector(".flap")!;
      const front=el.querySelector(".front")!;
      const sheet=el.querySelector(".paper")!;
      const seal=el.querySelector(".wax")!;
      return {
        visibleFlap:getComputedStyle(flap).display!=="none",
        flapArt:getComputedStyle(flap,"::after").backgroundImage,
        frontArt:getComputedStyle(front,"::after").backgroundImage,
        hiddenLetter:getComputedStyle(sheet).opacity,
        paper:getComputedStyle(el.querySelector(".back")!).backgroundImage,
        seal:getComputedStyle(seal).backgroundImage,
        width:el.getBoundingClientRect().width,
        overflow:document.documentElement.scrollWidth-window.innerWidth,
      };
    });
    expect(beauty.visibleFlap).toBe(true);
    expect(beauty.flapArt).toContain("birthday-letter-botanical.svg");
    expect(beauty.frontArt).toContain("birthday-letter-botanical.svg");
    expect(beauty.hiddenLetter).toBe("0");
    expect(beauty.paper).toContain("gradient");
    expect(beauty.seal).toContain("gradient");
    expect(beauty.width).toBeGreaterThan(270);
    expect(beauty.overflow).toBeLessThanOrEqual(3);
    if(width<=650){
      const globalCta=page.locator(".floating-whatsapp--experience");
      if(await globalCta.count())await expect(globalCta).toBeHidden();
    }
    const art=await page.request.get("/tehiceesto/birthday-letter-botanical.svg");
    expect(art.status()).toBe(200);
    expect(art.headers()["content-type"]||"").toContain("svg");
    mkdirSync("birthday-letter-evidence",{recursive:true});
    await page.screenshot({path:`birthday-letter-evidence/${mode}-closed.png`,fullPage:false});
    await envelope.click();
    await expect(envelope).toHaveClass(/open/);
    const letter=envelope.locator(".paper");
    await expect(letter).toHaveCSS("opacity","1",{timeout:3000});
    await expect(letter).toBeVisible();
    await expect(letter.locator("strong")).not.toBeEmpty();
    await expect(letter.locator("em")).not.toBeEmpty();
    await expect(scene.locator(".thi-letter-continue")).toBeVisible();
    await page.waitForTimeout(1150);
    if(width<=650){
      const paperBox=await letter.boundingBox();
      const continueBox=await scene.locator(".thi-letter-continue").boundingBox();
      expect(paperBox).not.toBeNull();
      expect(continueBox).not.toBeNull();
      // Never cross the upper back button / browser safe area.
      expect(paperBox!.y).toBeGreaterThanOrEqual(109);
      // Keep the continue control clear of the persistent progress bar.
      expect(continueBox!.y+continueBox!.height).toBeLessThan(height-47);
    }
    await page.screenshot({path:`birthday-letter-evidence/${mode}-opened.png`,fullPage:false});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(3);
    await scene.locator(".thi-letter-continue").click();
    await expect(stage).toHaveAttribute("data-scene","finale");
    expect(pageErrors).toEqual([]);
  });
}

test("reduced motion opens birthday letter instantly while keeping the couple demo isolated",async({page})=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:"reduce"});
  await reachLetter(page);
  const envelope=page.locator(".thi-birthday-letter-premium .thi-envelope");
  await envelope.click();
  await expect(envelope).toHaveClass(/open/);
  await expect(envelope.locator(".paper")).toHaveCSS("opacity","1");
  await expect(page.locator(".thi-birthday-letter-premium .thi-letter-continue")).toBeVisible();
  await page.goto("/tehiceesto/experiencias/pareja");
  await expect(page.locator(".thi-birthday-letter-premium")).toHaveCount(0);
});
