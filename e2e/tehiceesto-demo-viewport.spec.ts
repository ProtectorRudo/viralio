import { expect, test } from "playwright/test";

/* Regression: in-app Android browsers expand/retract their chrome while
   scrolling. Every public demo must cover the full dynamic viewport and
   never reveal the gray background of the outer document. */
const demos=[
  "pareja","mama","papa","cumpleanos","hijos",
  "abuelos","amistad","aniversario","propuesta",
];

test("all nine public demos have seamless dark backgrounds through a mobile viewport resize",async({page})=>{
  test.setTimeout(120_000);
  for(const slug of demos){
    await page.setViewportSize({width:390,height:736});
    await page.goto(`/tehiceesto/experiencias/${slug}`);
    const shell=page.locator(".thi-demo-page");
    const experience=page.locator(".thi-demo-page .thi-template-live");
    await expect(shell).toBeVisible();
    await expect(experience).toBeVisible();
    for(const height of [736,844,676]){
      await page.setViewportSize({width:390,height});
      const info=await page.evaluate(()=>{
        const shell=document.querySelector(".thi-demo-page") as HTMLElement;
        const scene=document.querySelector(".thi-template-live") as HTMLElement;
        const stage=document.querySelector(".thi-scene-stage") as HTMLElement;
        const root=document.querySelector(".thi-root") as HTMLElement;
        return {
          viewport:innerHeight,
          htmlBg:getComputedStyle(document.documentElement).backgroundColor,
          bodyBg:getComputedStyle(document.body).backgroundColor,
          rootHeight:root.getBoundingClientRect().height,
          demoHeight:shell.getBoundingClientRect().height,
          sceneHeight:scene.getBoundingClientRect().height,
          stageHeight:stage.getBoundingClientRect().height,
          demoBackground:getComputedStyle(shell).backgroundColor,
          demoExists:!!scene,
        };
      });
      expect(info.htmlBg).toBe("rgb(8, 7, 10)");
      expect(info.bodyBg).toBe("rgb(8, 7, 10)");
      expect(info.demoHeight).toBeGreaterThanOrEqual(info.viewport-2);
      expect(info.rootHeight).toBeGreaterThanOrEqual(info.viewport-2);
      expect(info.sceneHeight).toBeGreaterThanOrEqual(info.viewport-2);
      expect(info.stageHeight).toBeGreaterThanOrEqual(info.viewport-4);
      expect(info.demoBackground).not.toBe("rgba(0, 0, 0, 0)");
    }
  }
});
