import { expect,test } from "@playwright/test";

/** Geometry regression for the media rail that formerly floated over mobile CTAs.
 * Uses a public demo plus synthetic private media; requires no customer credentials.
 * The same scene engine/CSS is used by the editor and purchased gifts. */
for(const width of [390,1280]){
  test(`all active demos keep extra personal media beneath the scene at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:844});
    for(const slug of ["pareja","cumpleanos","hijos","abuelos","aniversario","propuesta","mama","papa","amistad"]){
      await page.goto(`/tehiceesto/experiencias/${slug}`,{waitUntil:"domcontentloaded"});
      if(await page.locator("main.thi-coming-page").count()){
        // Abuelos, Aniversario and Propuesta are not publicly buyable yet.
        // The versioned engines are still covered by the structural regression test.
        continue;
      }
      await expect(page.locator("main.thi-experience .thi-scene-stage")).toBeVisible();
      const geometry=await page.evaluate(()=>{
        const root=document.querySelector<HTMLElement>("main.thi-experience");
        const stage=root?.querySelector<HTMLElement>(".thi-scene-stage");
        const scene=stage?.querySelector<HTMLElement>(":scope > .thi-scene");
        if(!root||!stage||!scene)throw new Error("Missing public engine scene");
        const extra=document.createElement("aside");
        extra.className="thi-attached-media";
        extra.innerHTML=`<figure class="thi-attached-photo p1"><img alt="Foto personalizada" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23999999'/%3E%3C/svg%3E"></figure><figure class="thi-attached-video"><video controls playsinline></video></figure><article class="thi-attached-audio"><span>♪</span><div><audio controls></audio></div></article>`;
        stage.appendChild(extra);
        stage.classList.add("has-attached-media");
        const originalPosition=getComputedStyle(extra).position;
        root.setAttribute("data-customer-gift","true");
        const stageRect=stage.getBoundingClientRect();
        const sceneRect=scene.getBoundingClientRect();
        const extraRect=extra.getBoundingClientRect();
        const style=getComputedStyle(extra);
        const items=[...extra.children].map(node=>{
          const rect=node.getBoundingClientRect();
          return {left:rect.left,right:rect.right,width:rect.width,position:getComputedStyle(node).position};
        });
        return {
          originalPosition,
          position:style.position,
          columns:style.gridTemplateColumns,
          top:extraRect.top,
          bottom:sceneRect.bottom,
          width:extraRect.width,
          stageWidth:stageRect.width,
          overflowY:style.overflowY,
          items,
          viewportWidth:window.innerWidth,
        };
      });
      expect(geometry.originalPosition,`${slug}: demo should retain original cinematic rail`).toBe("absolute");
      expect(geometry.position,`${slug}: private media should not float`).toBe("relative");
      expect(geometry.top,`${slug}: media overlapped the scene`).toBeGreaterThanOrEqual(geometry.bottom-2);
      expect(geometry.width,`${slug}: media should be visible`).toBeGreaterThan(100);
      expect(geometry.overflowY).toBe("visible");
      expect(geometry.items).toHaveLength(3);
      for(const item of geometry.items){
        expect(item.width,`${slug}: missing media card`).toBeGreaterThan(70);
        expect(item.left,`${slug}: media overflowed left`).toBeGreaterThanOrEqual(-1);
        expect(item.right,`${slug}: media overflowed right`).toBeLessThanOrEqual(geometry.viewportWidth+1);
      }
    }
  });
}
