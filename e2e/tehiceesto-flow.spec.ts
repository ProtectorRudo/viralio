import { expect, test, type Page } from "@playwright/test";

const slugs = [
  "pareja",
  "cumpleanos",
  "hijos",
  "abuelos",
  "aniversario",
  "propuesta",
  "mama-papa",
  "amistad",
];

async function sceneName(page: Page) {
  return page.locator("main.thi-experience").getAttribute("data-scene");
}

async function waitForScene(page: Page, name: string) {
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene", name);
}

async function advanceOne(page: Page) {
  const current = await sceneName(page);
  if (!current) throw new Error("missing_scene");

  if (current === "intro") {
    await page.getByRole("button", { name: "Entrar" }).click();
  } else if (current === "door") {
    await page.locator(".thi-door-wrap").click();
    await page.getByRole("button", { name: "Entrar →" }).click();
  } else if (current === "memories") {
    await page.getByRole("button", { name: /Seguir/ }).click();
  } else if (current === "light") {
    await page.getByRole("button", { name: "Revelar recuerdo con luz" }).click();
    await page.getByRole("button", { name: /Seguir con este recuerdo/ }).click();
  } else if (current === "hold") {
    await page.getByRole("button", { name: /Mantené|Mantené el|Mantené este/i }).press("Enter");
    await page.getByRole("button", { name: "Seguir →" }).click();
  } else if (current === "stars") {
    const stars = page.locator(".thi-stars button");
    await stars.nth(0).click();
    await stars.nth(1).click();
    await stars.nth(2).click();
    await page.getByRole("button", { name: /Continuar/ }).click();
  } else if (current === "scratch") {
    await page.getByRole("button", { name: /revelar sin raspar/i }).click();
    await page.getByRole("button", { name: /Ya lo descubrí/ }).click();
  } else if (current === "letter") {
    await page.locator(".thi-envelope").click();
    await page.getByRole("button", { name: /Guardar estas palabras/ }).click();
  } else if (current === "candles") {
    await page.getByRole("button", { name: /apagarlas tocando/i }).click();
    await page.getByRole("button", { name: /Seguir/ }).click();
  } else if (current === "balloons") {
    const balloons = page.locator(".thi-balloons button");
    await balloons.nth(0).click();
    await balloons.nth(1).click();
    await balloons.nth(2).click();
    await page.getByRole("button", { name: /Continuar/ }).click();
  } else if (current === "timeline") {
    await page.getByRole("button", { name: /Seguir la historia/ }).click();
  } else if (current === "voices") {
    const fallbackVoice = page.locator(".thi-voices button").first();
    if (await fallbackVoice.count()) {
      await fallbackVoice.click();
    } else {
      await page.locator(".thi-voice-audio audio").first().evaluate((el: HTMLAudioElement) => {
        el.dispatchEvent(new Event("play", { bubbles: true }));
      });
    }
    await page.getByRole("button", { name: /Continuar/ }).click();
  } else if (current === "quiz") {
    await page.locator(".thi-quiz button").nth(1).click();
    await page.getByRole("button", { name: /Seguir/ }).click();
  } else if (current === "vault") {
    await page.locator(".thi-vault").click();
    await page.getByRole("button", { name: /Abrir la última carta/ }).click();
  } else if (current === "capsule") {
    await page.locator(".thi-capsule").click();
    await page.getByRole("button", { name: /Guardar este momento/ }).click();
  } else if (current === "video") {
    await page.getByRole("button", { name: /Continuar/ }).click();
  } else {
    throw new Error(`cannot_advance_from_${current}`);
  }
}

for (const slug of slugs) {
  test(`Te Hice Esto demo ${slug} completes without getting stuck`, async ({ page }) => {
    test.setTimeout(45_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/tehiceesto/experiencias/${slug}`);
    await waitForScene(page, "intro");

    for (let step = 0; step < 20; step += 1) {
      const current = await sceneName(page);
      if (current === "finale" || current === "proposal") break;

      const before = current;
      await advanceOne(page);

      await expect
        .poll(() => sceneName(page), {
          timeout: 4_000,
          message: `${slug} did not advance from scene ${before}`,
        })
        .not.toBe(before);
    }

    const ending = await sceneName(page);
    expect(["finale", "proposal"], `${slug} never reached an ending`).toContain(ending);
  });
}

test("scene state resets when revisiting and restart always starts clean", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tehiceesto/experiencias/cumpleanos");

  await advanceOne(page); // intro -> candles
  await waitForScene(page, "candles");
  await page.getByRole("button", { name: /apagarlas tocando/i }).click();
  await page.getByRole("button", { name: /Seguir/ }).click();
  await waitForScene(page, "balloons");

  const balloons = page.locator(".thi-balloons button");
  await balloons.nth(0).click();
  await expect(balloons.nth(0)).toHaveClass(/pop/);

  await page.getByRole("button", { name: "Escena anterior" }).click();
  await waitForScene(page, "candles");

  await expect(page.locator(".thi-cake")).not.toHaveClass(/out/);
  await page.getByRole("button", { name: /apagarlas tocando/i }).click();
  await page.getByRole("button", { name: /Seguir/ }).click();
  await waitForScene(page, "balloons");

  await expect(page.locator(".thi-balloons button.pop")).toHaveCount(0);

  await balloons.nth(0).click();
  await balloons.nth(1).click();
  await page.getByRole("button", { name: "Reiniciar experiencia" }).click();

  await waitForScene(page, "intro");
  await expect(page.locator(".thi-balloons button.pop")).toHaveCount(0);
});


test("unlocked scenes also advance from the persistent bottom control", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tehiceesto/experiencias/pareja");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.locator(".thi-door-wrap").click();
  await page.getByRole("button", { name: "Escena siguiente" }).click();
  await waitForScene(page, "memories");
  await page.getByRole("button", { name: "Escena siguiente" }).click();
  await waitForScene(page, "voices");
  await page.getByRole("button", { name: "Reproducir nota de voz" }).click();
  await page.getByRole("button", { name: "Escena siguiente" }).click();
  await waitForScene(page, "light");
  await page.getByRole("button", { name: "Revelar recuerdo con luz" }).click();
  await page.getByRole("button", { name: "Escena siguiente" }).click();
  await waitForScene(page, "stars");

  const stars = page.locator(".thi-stars button");
  await stars.nth(0).click();
  await stars.nth(1).click();
  await stars.nth(2).click();

  await expect(page.getByRole("button", { name: "Escena siguiente" })).toBeEnabled();
  await page.getByRole("button", { name: "Escena siguiente" }).click();
  await waitForScene(page, "scratch");
});


test("pareja includes an intimate voice-note scene before the light reveal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tehiceesto/experiencias/pareja");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.locator(".thi-door-wrap").click();
  await page.getByRole("button", { name: "Entrar →" }).click();
  await page.getByRole("button", { name: /Seguir/ }).click();
  await waitForScene(page, "voices");
  await expect(page.getByRole("heading", { name: "Escuchá esto." })).toBeVisible();
  await page.getByRole("button", { name: "Reproducir nota de voz" }).click();
  await expect(page.getByText(/desde que estás vos/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Guardar esta voz/ })).toBeEnabled();
});
