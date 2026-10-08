import { expect, test } from "playwright/test";

const demoSlugs = [
  "pareja","mama","papa","cumpleanos","hijos",
  "abuelos","amistad","aniversario","propuesta",
] as const;

const formerlyHiddenScenes: Record<string,string[]> = {
  pareja: ["intro","door","light","stars","scratch","hold","letter","finale"],
  mama: ["intro","childhood","memories","care","sacrifices","voices","finale"],
  papa: ["intro","memories","lessons","presence","inheritance","voices","finale"],
};

test("Quiero el mío stays visible and targets the correct template in all nine public demos", async ({ page }) => {
  test.setTimeout(95_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of demoSlugs) {
    await page.goto(`/tehiceesto/experiencias/${slug}`);
    const demo=page.locator(".thi-demo-page .thi-template-live");
    const purchase=page.locator("a.floating-create-cta.floating-whatsapp--experience");
    await expect(demo).toBeAttached();
    await expect(purchase).toHaveCount(1);
    await expect(purchase).toHaveAttribute("href",new RegExp(`/crear\\?experiencia=${slug}$`));

    for (const scene of formerlyHiddenScenes[slug] || ["intro"]) {
      await demo.evaluate((element, currentScene) => { element.setAttribute("data-scene", currentScene); }, scene);
      await expect(purchase).toBeVisible();
      const appearance=await purchase.evaluate(element=>{
        const style=getComputedStyle(element);
        return {visibility:style.visibility,opacity:Number(style.opacity),pointerEvents:style.pointerEvents,position:style.position};
      });
      expect(appearance.visibility).toBe("visible");
      expect(appearance.opacity).toBe(1);
      expect(appearance.pointerEvents).toBe("auto");
      expect(appearance.position).toBe("fixed");
    }
  }
});

test("demo purchase CTA skips the chooser and opens the right gift contact form",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/pareja");
  await page.locator("a.floating-create-cta.floating-whatsapp--experience").click();
  await expect(page).toHaveURL(/\/crear\?experiencia=pareja$/);
  await expect(page.locator(".thi-purchase-page")).toHaveAttribute("data-active-step","1");
  await expect(page.getByText("Nuestra historia",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:/Ir a Mercado Pago/})).toBeVisible();
});
