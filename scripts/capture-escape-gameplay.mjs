/**
 * Captura material REAL desde los juegos publicados, no renders promocionales.
 * No publica videos automáticamente: hay que inspeccionarlos antes de usarlos.
 * Ejecutar en GitHub Actions con Chromium/ffmpeg.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const rooms = [
  { id: "caso-m", url: "https://tehiceesto.com/escape-play/caso-m/" },
  { id: "la-ultima-funcion", url: "https://protectorrudo.github.io/la-ultima-funcion/" },
  { id: "la-ultima-campanada", url: "https://la-ultima-campanada-desafio-v6.vercel.app/" },
];
const out = path.resolve("trailer-review");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = [];

try {
  for (const room of rooms) {
    const ctx = await browser.newContext({
      viewport: { width: 960, height: 540 },
      deviceScaleFactor: 1,
      locale: "es-AR",
      recordVideo: { dir: out, size: { width: 960, height: 540 } },
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    const result = { room: room.id, url: room.url, loaded: false, canvas: false, video: false, errors };
    const original = page.video();
    try {
      const response = await page.goto(room.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      result.http = response?.status() ?? 0;
      if (!response?.ok()) throw new Error("La sala respondió HTTP " + result.http);
      result.loaded = true;
      await page.waitForTimeout(3500);
      // Cada juego decide su propia introducción: tocar un CTA real, si aparece.
      const start = /^(entrar|iniciar|empezar|comenzar|jugar|aceptar|continuar|abrir|empezá|firmar|acceder|ingresar)/i;
      for (let pass = 0; pass < 3; pass++) {
        const candidates = page.getByRole("button");
        let clicked = false;
        const count = Math.min(await candidates.count(), 35);
        for (let i = 0; i < count; i++) {
          const button = candidates.nth(i);
          if (!await button.isVisible().catch(() => false)) continue;
          const label = ((await button.innerText().catch(() => "")) || (await button.getAttribute("aria-label")) || "").trim();
          if (!start.test(label)) continue;
          await button.click({ timeout: 2000 }).catch(() => {});
          clicked = true;
          await page.waitForTimeout(1600);
          break;
        }
        if (!clicked) break;
      }

      // Debe haber una escena WebGL real; no aceptamos páginas de error ni una portada estática.
      result.canvas = (await Promise.all(page.frames().map(async frame => {
        return frame.locator("canvas").count().catch(() => 0);
      }))).some(n => n > 0);
      await page.screenshot({ path: path.join(out, room.id + "-preview.png"), fullPage: false });
      if (!result.canvas) throw new Error("No se detectó un canvas del juego; la grabación requiere revisión");

      // Paseo breve de cámara sin revelar claves, soluciones ni el final.
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(520 + Math.sin(i) * 150, 270 + Math.cos(i) * 60, { steps: 15 });
        await page.keyboard.down(i % 2 ? "d" : "w");
        await page.waitForTimeout(3300);
        await page.keyboard.up(i % 2 ? "d" : "w");
      }
      await page.waitForTimeout(3500);
    } catch (error) {
      result.failure = String(error);
      await page.waitForTimeout(1500).catch(() => {});
    } finally {
      await ctx.close();
    }
    const webm = path.join(out, room.id + ".webm");
    await original.saveAs(webm);
    // Los últimos 19 segundos priorizan la escena jugable frente al loader.
    const mp4 = path.join(out, room.id + ".mp4");
    const encode = spawnSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-sseof", "-19", "-i", webm, "-t", "19",
      "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-preset", "fast", "-crf", "22", "-movflags", "+faststart", mp4,
    ], { encoding: "utf8" });
    result.video = encode.status === 0 && result.canvas;
    if (encode.status !== 0) result.encodeError = encode.stderr?.slice(0, 1500);
    results.push(result);
    process.stdout.write(JSON.stringify(result) + "\n");
  }
} finally {
  await browser.close();
}

await writeFile(path.join(out, "capture-report.json"), JSON.stringify(results, null, 2));
const failures = results.filter(r => !r.loaded || !r.canvas || !r.video || r.errors.length);
if (failures.length) {
  console.error("Las siguientes capturas necesitan revisión: " + failures.map(r => r.room).join(", "));
  process.exitCode = 1;
} else {
  console.log("Capturas generadas para revisión. NO están publicadas como tráilers.");
}
