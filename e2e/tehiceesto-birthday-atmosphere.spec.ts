import {expect,test,type Page} from "@playwright/test";
import {mkdirSync} from "node:fs";

const SCENES=["intro","candles","balloons","memories","light","voices","hold","hugs","letter","finale"] as const;
type Backdrop={scene:string;root:string;ambient:string;stars:string;overflow:number;introFill?:string;finalFill?:string};

async function snapshot(page:Page,mode:string,records:Backdrop[]){
  const main=page.locator("main.thi-experience.thi-theme-cumpleanos");
  const current=await main.getAttribute("data-scene");
  expect(current).toBeTruthy();
  await page.waitForTimeout(900);
  const style=await main.evaluate(el=>{
    const computed=getComputedStyle(el);
    const before=getComputedStyle(el,"::before");
    const after=getComputedStyle(el,"::after");
    const intro=el.querySelector(".birthday-gift-wrap .couple-gift-intro");
    const finale=el.querySelector(".thi-bday-finale");
    return {
      root:computed.backgroundImage,
      ambient:before.backgroundImage,
      stars:after.backgroundImage,
      overflow:document.documentElement.scrollWidth-innerWidth,
      introFill:intro?getComputedStyle(intro).backgroundColor:undefined,
      finalFill:finale?getComputedStyle(finale).backgroundColor:undefined
    };
  });
  expect(style.root).toContain("radial-gradient");
  expect(style.root).toContain("linear-gradient");
  expect(style.ambient).toContain("radial-gradient");
  expect(style.stars).toContain("radial-gradient");
  expect(style.overflow).toBeLessThanOrEqual(3);
  if(current==="intro")expect(style.introFill).toBe("rgba(0, 0, 0, 0)");
  if(current==="finale")expect(style.finalFill).toBe("rgba(0, 0, 0, 0)");
  records.push({scene:current!,...style});
  await page.screenshot({path:`birthday-atmosphere-evidence/${mode}-${String(records.length).padStart(2,"0")}-${current}.png`,fullPage:false});
}

async function enter(page:Page){
  await page.addInitScript(()=>Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>{throw new Error("QA fallback mic")}}}));
  await page.goto("/tehiceesto/experiencias/cumpleanos");
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","intro");
}

for(const [mode,width,height] of [["mobile",390,844],["small-mobile",360,700],["desktop",1440,960]] as const){
  test(`single amber/ink backdrop stays identical through all ten birthday scenes - ${mode}`,async({page})=>{
    test.setTimeout(165_000);
    const errors:string[]=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.setViewportSize({width,height});
    mkdirSync("birthday-atmosphere-evidence",{recursive:true});
    const records:Backdrop[]=[];
    const main=page.locator("main.thi-experience");
    await enter(page);
    await snapshot(page,mode,records);
    await page.locator(".couple-gift-unseal").click();
    await expect(page.locator(".gift-phase-revealed")).toBeVisible({timeout:9000});
    await page.locator(".couple-gift-continue").click();
    await expect(main).toHaveAttribute("data-scene","candles");
    await snapshot(page,mode,records);
    await page.locator('[data-action="blow-mic"]').click();
    await page.locator('[data-action="blow-fallback"]').dispatchEvent("click");
    await expect(page.locator(".thi-birthday-ritual")).toHaveClass(/out/);
    await page.locator(".thi-wish-continue").click();
    await expect(main).toHaveAttribute("data-scene","balloons");
    await snapshot(page,mode,records);
    for(const i of [0,1,2])await page.locator('[data-action="balloon"]').nth(i).click();
    await page.locator(".thi-bday-balloon-continue").click();
    await expect(main).toHaveAttribute("data-scene","memories");
    await snapshot(page,mode,records);
    await page.locator('.thi-scene-memories [data-action="advance"]').click();
    await expect(main).toHaveAttribute("data-scene","light");
    await snapshot(page,mode,records);
    for(const i of [1,2,3])await page.locator(`[data-action="birthday-light-${i}"]`).click();
    await page.locator('[data-action="advance"]').click();
    await expect(main).toHaveAttribute("data-scene","voices");
    await snapshot(page,mode,records);
    await page.locator(".thi-bday-voice-next").click();
    await expect(main).toHaveAttribute("data-scene","hold");
    await snapshot(page,mode,records);
    await page.locator('[data-action="hold-accessible"]').click();
    await expect(page.locator('[data-wish-revealed="true"]')).toBeVisible();
    await page.locator(".thi-wish-orb-continue").click();
    await expect(main).toHaveAttribute("data-scene","hugs");
    await snapshot(page,mode,records);
    await page.locator('[data-action="receive-hugs"]').click();
    await page.locator('[data-action="finish-hugs"]').click();
    await expect(page.locator('[data-hugs-complete="true"]')).toBeVisible();
    await page.locator(".thi-bday-hugs-continue").click();
    await expect(main).toHaveAttribute("data-scene","letter");
    await snapshot(page,mode,records);
    await page.locator('[data-action="open-letter"]').click();
    await expect(page.locator(".thi-birthday-letter-premium.is-open")).toBeVisible();
    await page.locator(".thi-letter-continue").click();
    await expect(main).toHaveAttribute("data-scene","finale");
    await snapshot(page,mode,records);
    expect(records.map(s=>s.scene)).toEqual(SCENES);
    // The background is not re-created per screen. Identical CSS image means
    // no discontinuity in the scene base, lines, or tiny dust particles.
    for(const field of ["root","ambient","stars"] as const){
      for(const sample of records)expect(sample[field],`${sample.scene} differs in ${field}`).toBe(records[0][field]);
    }
    expect(errors).toEqual([]);
    console.log("BIRTHDAY_BACKGROUND_AUDIT",JSON.stringify({
      mode,chapters:records.length,identicalBase:true,identicalAmbient:true,identicalParticles:true,
      maxHorizontalOverflow:Math.max(...records.map(r=>r.overflow))
    }));
  });
}
