import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("visual-qa-evidence",{recursive:true});

test.describe("UMBRAL · el juego puede completarse", () => {
  test("cuatro capítulos, pistas correctas, decisión y puntuación", async ({ page }) => {
    await page.goto("/escape");
    await expect(page.getByRole("heading", { name: /UMBRAL/ })).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-intro-desktop.png",fullPage:true});
    await page.getByRole("button", { name: /CRUZAR EL UMBRAL/ }).click();
    await expect(page.getByRole("heading", { name: "El vestíbulo", exact: true })).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-vestibulo-desktop.png",fullPage:true});

    await page.getByRole("button", { name: /Abrir expediente/ }).click();
    await expect(page.getByRole("heading", { name: "El expediente de Eva" })).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-expediente-desktop.png",fullPage:true});
    await expect(page.getByText("0 / 8")).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Retrato de Nora" }).first().click();
    await expect(page.getByText("1918").last()).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-artefacto-desktop.png",fullPage:true});
    await page.getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: /Abrir expediente/ }).click();
    await expect(page.getByText("1 / 8")).toBeVisible();
    await expect(page.getByRole("heading", { name: "El retrato de Nora" })).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-expediente-recuperado-desktop.png",fullPage:true});
    await page.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Abrir cerradura" }).first().click();
    await page.getByRole("textbox", { name: "Código de tres cifras" }).fill("427");
    await page.getByRole("button", { name: /DESBLOQUEAR/ }).click();
    await expect(page.getByRole("heading", { name: "El despacho", exact: true })).toBeVisible({ timeout: 5000 });
    await page.screenshot({path:"visual-qa-evidence/umbral-despacho-desktop.png",fullPage:true});

    await page.getByRole("button", { name: "Leer nota" }).first().click();
    await expect(page.getByText(/Primero mirá el cielo/)).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: "Vela con la luna" }).first().click();
    await expect(page.locator('svg g[data-candle="luna"]')).toHaveAttribute("data-active","true");
    await expect(page.locator('svg g[data-candle="llave"]')).toHaveAttribute("data-active","false");
    await page.getByRole("button", { name: "Vela con la llave" }).first().click();
    await page.getByRole("button", { name: "Vela con la rosa" }).first().click();
    await page.getByRole("button", { name: "Puerta secreta" }).first().click();
    await expect(page.getByRole("heading", { name: "La habitación de Eva", exact: true })).toBeVisible({ timeout: 5000 });
    await page.screenshot({path:"visual-qa-evidence/umbral-eva-desktop.png",fullPage:true});

    await page.getByRole("button", { name: "Leer carta" }).first().click();
    await expect(page.getByText(/Seguía con MI, con LA/)).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Examinar muñeca" }).first().click();
    await expect(page.getByText(/RECUERDO OPCIONAL RECUPERADO/)).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Tocar caja musical" }).first().click();
    for (const note of ["SOL", "MI", "LA", "SOL"]) {
      await page.getByRole("button", { name: note, exact: true }).click();
    }
    await expect(page.getByRole("heading", { name: "La canción de Eva" })).toBeVisible();
    await page.getByRole("button", { name: "GUARDAR LA FOTOGRAFÍA" }).click();
    await page.getByRole("button", { name: "Abrir puerta" }).first().click();
    await expect(page.getByRole("heading", { name: "El corazón de la casa", exact: true })).toBeVisible({ timeout: 5000 });
    await page.screenshot({path:"visual-qa-evidence/umbral-corazon-desktop.png",fullPage:true});

    await page.getByRole("button", { name: "Fusible 2" }).first().click();
    await expect(page.locator('svg g[data-fuse="2"]')).toHaveAttribute("data-active","true");
    await expect(page.locator('svg g[data-fuse="3"]')).toHaveAttribute("data-active","false");
    await page.getByRole("button", { name: "Fusible 5" }).first().click();
    await page.getByRole("button", { name: "Bajar palanca" }).first().click();
    await expect(page.getByRole("heading", { name: "La última decisión" })).toBeVisible();
    await page.getByRole("button", { name: /VOLVER POR EVA/ }).click();
    await expect(page.getByRole("heading", { name: "No escapaste solo." })).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-final-desktop.png",fullPage:true});
    await expect(page.getByText("PUNTUACIÓN")).toBeVisible();
    await expect(page.getByText(/NUEVO RÉCORD PERSONAL/)).toBeVisible();
  });

  test("móvil: objetos accesibles sin depender del panorama, pausa y retorno", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/escape");
    await page.getByRole("button", { name: /CRUZAR EL UMBRAL/ }).click();
    await expect(page.getByRole("navigation", { name: "Objetos para investigar" })).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-vestibulo-mobile.png",fullPage:true});
    await page.getByRole("navigation", { name: "Objetos para investigar" }).getByRole("button", { name: "Abrir cerradura" }).click();
    await expect(page.getByRole("heading", { name: "Una cerradura sin llave" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: /PAUSAR/ }).last().click();
    await expect(page.getByRole("heading", { name: /Hasta la casa guarda silencio/ })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: /Hasta la casa guarda silencio/ })).toBeVisible();
    await page.getByRole("button", { name: /SEGUIR INVESTIGANDO/ }).click();
    await expect(page.getByRole("heading", { name: "El vestíbulo", exact: true })).toBeVisible();
  });

  test("código incorrecto no abre la puerta", async ({ page }) => {
    await page.goto("/escape");
    await page.getByRole("button", { name: /CRUZAR EL UMBRAL/ }).click();
    await page.getByRole("button", { name: "Abrir cerradura" }).first().click();
    await page.getByRole("textbox", { name: "Código de tres cifras" }).fill("123");
    await page.getByRole("button", { name: /DESBLOQUEAR/ }).click();
    await expect(page.getByRole("heading", { name: "El vestíbulo", exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Código de tres cifras" })).toHaveValue("");
  });
  test("el reloj respeta tiempo real, segundo plano y pausa", async ({ page }) => {
    await page.clock.install({time:new Date("2026-10-09T21:00:00Z")});
    await page.goto("/escape");
    await page.getByRole("button", { name: /CRUZAR EL UMBRAL/ }).click();
    await expect(page.getByText("25:00")).toBeVisible();
    await page.clock.fastForward(15000);
    await expect(page.getByText("24:45")).toBeVisible();
    await page.getByRole("button", { name: "Pausar partida" }).click();
    await page.clock.fastForward(30000);
    await expect(page.getByText("24:45")).toBeVisible();
    await page.getByRole("button", { name: /SEGUIR INVESTIGANDO/ }).click();
    await page.clock.fastForward(5000);
    await expect(page.getByText("24:40")).toBeVisible();
  });
  test("el modo pesadilla exige doce minutos sin afectar el modo historia",async ({page})=>{
    await page.goto("/escape");
    await page.getByRole("button",{name:/12 MIN/}).click();
    await expect(page.getByText("Tenés 12 minutos")).toBeVisible();
    await page.getByRole("button",{name:/CRUZAR EL UMBRAL/}).click();
    await expect(page.getByText("12:00")).toBeVisible();
    await page.getByRole("button",{name:"Pausar partida"}).click();
    await page.reload();
    await expect(page.getByRole("heading",{name:/Hasta la casa guarda silencio/})).toBeVisible();
    await page.getByRole("button",{name:/SEGUIR INVESTIGANDO/}).click();
    await expect(page.getByText("MODO PESADILLA")).toBeVisible();
  });
});
