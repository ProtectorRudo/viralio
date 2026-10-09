import {expect,test,type Page} from "@playwright/test";

async function enterMamaVoices(page:Page){
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tehiceesto/experiencias/mama");
  await page.locator('[data-action="advance"]').first().click();
  await page.getByRole("button",{name:/Seguir recordando/i}).click();
  const memoryNext=page.locator(".thi-mama-memory-local-nav > button").last();
  await memoryNext.click();
  await memoryNext.click();
  await page.getByRole("button",{name:/Seguir con la historia/i}).click();
  for(const i of [0,1,2])await page.locator(".mama-care-file").nth(i).click();
  await page.locator(".mama-care-continue").click();
  for(const i of [0,1,2,3])await page.locator(".mama-sacrifice-trigger").nth(i).click();
  await page.locator(".mama-sacrifice-continue").click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","voices");
}

test("Mamá puede ir a la carta sin tener que escuchar todos los audios",async({page})=>{
  test.setTimeout(90_000);
  await enterMamaVoices(page);
  await expect(page.locator(".thi-mama-voice-picker")).toBeVisible();
  await expect(page.locator(".thi-mama-voice-list>button")).toHaveCount(3);
  const skip=page.locator(".thi-mama-voice-picker .thi-mama-voice-skip");
  await expect(skip).toBeEnabled();
  await skip.click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","letter");
});

test("Audio real de Alina está publicado en MP3, se puede reproducir o saltar",async({page})=>{
  test.setTimeout(90_000);
  const response=await page.request.get("/mama-voz-web.mp3");
  expect(response.status()).toBe(200);
  expect((await response.body()).byteLength).toBeGreaterThan(30000);
  await enterMamaVoices(page);
  await page.locator('[data-action="mama-voice-choice"]').first().click();
  await expect(page.locator(".thi-mama-voice-player")).toBeVisible();
  const audio=page.locator('[data-action="mama-real-audio"]');
  await expect(audio).toHaveAttribute("src","/mama-voz-web.mp3");
  await page.locator('[data-action="mama-voice-toggle"]').click();
  await expect.poll(async()=>audio.evaluate((node:HTMLAudioElement)=>!node.paused&&!node.error),{timeout:10000}).toBe(true);
  await expect(page.locator('[data-action="mama-voice-toggle"]')).toHaveAttribute("data-voice-state","playing");
  await page.locator(".thi-mama-voice-player .thi-mama-voice-skip").click();
  await expect(page.locator("main.thi-experience")).toHaveAttribute("data-scene","letter");
});
