import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("visual-qa-evidence",{recursive:true});
// Chromium can race the first full-page screenshot immediately after initial
// webfont/image decode; retry the visual capture without suppressing failures.
async function visualAudit(page:Page,file:string){
  for(let attempt=0;attempt<3;attempt++){
    try{await page.screenshot({path:"visual-qa-evidence/"+file,fullPage:true,animations:"disabled",timeout:12000});return;}
    catch(error){if(attempt===2)throw error;await page.waitForTimeout(360);}
  }
}

test.describe("UMBRAL · el juego puede completarse", () => {
  test("escuchar la casa: pista ambiental accesible con o sin sonido, sin bloquear los acertijos", async ({ page }) => {
    await page.goto("/escape");
    await page.getByRole("button", { name: /SONIDO ACTIVADO/ }).click();
    await page.getByRole("button", { name: /ENTRAR A LA CASA/ }).click();
    const station=page.getByTestId("umbral-listening");
    await expect(station).toHaveAttribute("data-room","0");
    await expect(station).toHaveAttribute("data-stage","ready");
    await page.getByRole("button", { name: "Escuchar detrás de las paredes" }).click();
    await expect(station).toHaveAttribute("data-stage","tuning");
    await expect(station).toHaveAttribute("data-stage","heard",{timeout:6000});
    await expect(station.getByText(/Tres pasos atraviesan el vestíbulo/)).toBeVisible();
    await page.getByRole("button", { name: "Abrir cerradura" }).first().click();
    await expect(page.getByRole("heading", { name: "Una cerradura sin llave" })).toBeVisible();
    await expect(page.getByTestId("umbral-listening")).toHaveCount(0);
    await page.getByRole("button", { name: "Cerrar" }).click();
    await expect(page.getByTestId("umbral-listening")).toHaveAttribute("data-stage","ready");
  });

  test("espejo: alternativa por teclado y recuerdo persistente en partida guardada", async ({ page }) => {
    await page.addInitScript(() => {
      // Init scripts run again on reload: seed just once to test real persistence.
      if(window.sessionStorage.getItem("umbral-mirror-seeded")==="yes")return;
      window.sessionStorage.setItem("umbral-mirror-seeded","yes");
      window.localStorage.setItem("umbral-casa-13-v1", JSON.stringify({
        phase:"playing", room:2, seconds:950, hints:[0,0,0,0], mistakes:0, difficulty:"story",
        puzzles:{clockWound:false,mirrorRead:false,portraits:[],candles:[],studyOpen:true,notesRead:true,evaRead:false,melody:[],nurseryOpen:false,keepsake:false,fuses:[],power:false,ending:null},
      }));
    });
    await page.goto("/escape");
    await page.getByRole("button",{name:/SEGUIR INVESTIGANDO/}).click();
    await page.getByRole("button",{name:"Limpiar espejo empañado"}).first().click();
    await expect(page.getByTestId("umbral-mirror")).toHaveAttribute("data-revealed","false");
    const fallback=page.getByRole("button",{name:/REVELAR INSCRIPCIÓN SIN DESLIZAR/});
    await fallback.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("umbral-mirror")).toHaveAttribute("data-revealed","true");
    await page.getByRole("button",{name:"Cerrar"}).click();
    await page.reload();
    await page.getByRole("button",{name:/SEGUIR INVESTIGANDO/}).click();
    await page.getByRole("button",{name:"Limpiar espejo empañado"}).first().click();
    await expect(page.getByTestId("umbral-mirror")).toHaveAttribute("data-revealed","true");
  });

  test("cuatro capítulos, pistas correctas, decisión y puntuación", async ({ page }) => {
    // Cinematic screenshots of four chapters need a generous overall CI budget.
    // Keep all puzzle/assertion steps; do not drop the final scene visual audit.
    test.setTimeout(90_000);
    await page.goto("/escape");
    await expect(page.getByRole("heading", { name: /UMBRAL/ })).toBeVisible();
    await expect(page.locator(".notRealClass")).toHaveCount(0);
    await expect(page.getByText("Todo comienza con una puerta cerrada.")).toBeVisible();
    const photo=await page.request.get("/escape/images/mansion.webp");
    expect(photo.status()).toBe(200);
    for(const name of ["portrait","clock","lock","letter","music","doll","circuit","door","signal"]) {
      const asset=await page.request.get("/escape/images/objects/"+name+".webp");
      expect(asset.status(),name+" is missing").toBe(200);
    }
    for(const name of ["footsteps-wood","wood-creak","heavy-door"]) {
      const recording=await page.request.get("/escape/audio/"+name+".ogg");
      expect(recording.status(),name+" CC0 recording").toBe(200);
      expect((await recording.body()).byteLength).toBeGreaterThan(9000);
    }
        await page.screenshot({path:"visual-qa-evidence/umbral-intro-desktop.png",fullPage:true,animations:"disabled"});
    await page.getByRole("button", { name: /ENTRAR A LA CASA/ }).click();
    await expect(page.getByRole("heading", { name: "El vestíbulo", exact: true })).toBeVisible();
    await expect(page.getByTestId("umbral-atmosphere")).toHaveAttribute("data-mood","foyer");
    await expect(page.getByTestId("umbral-atmosphere")).toHaveAttribute("data-powered","no");
    await page.screenshot({path:"visual-qa-evidence/umbral-vestibulo-desktop.png",fullPage:true,animations:"disabled"});

    await page.getByRole("button", { name: /Abrir expediente/ }).click();
    await expect(page.getByRole("heading", { name: "El expediente de Eva" })).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-expediente-desktop.png",fullPage:true,animations:"disabled"});
    await expect(page.getByText("0 / 8")).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Retrato de Nora" }).first().click();
    await expect(page.locator('[data-focus-object="portrait"][data-focus-room="0"]')).toBeVisible();
    await expect(page.getByText("1918").last()).toBeVisible();
    await expect.poll(async()=>page.evaluate(async()=>{const image=new Image();image.src="/escape/images/objects/portrait.webp";await image.decode();return image.naturalWidth;})).toBeGreaterThan(300);
    await page.screenshot({path:"visual-qa-evidence/umbral-artefacto-desktop.png",fullPage:true,animations:"disabled"});
    await page.getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: /Abrir expediente/ }).click();
    await expect(page.getByText("1 / 8")).toBeVisible();
    await expect(page.getByRole("heading", { name: "El retrato de Nora" })).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-expediente-recuperado-desktop.png",fullPage:true,animations:"disabled"});
    await page.getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: "Examinar reloj" }).first().click();
    await expect(page.locator('[data-focus-object="clock"]')).toBeVisible();
    await visualAudit(page,"umbral-reloj-camara-integrada-desktop.png");
    await expect(page.getByRole("heading",{name:"El reloj detenido"})).toBeVisible();
    const clock=page.locator('[data-clock-solved]');
    await expect(clock).toHaveAttribute("data-clock-solved","false");
    await expect(page.getByRole("slider",{name:"Manivela del reloj"})).toHaveAttribute("aria-valuenow","0");
    await page.screenshot({path:"visual-qa-evidence/umbral-reloj-mecanismo-desktop.png",fullPage:true,animations:"disabled"});
    for(let t=0;t<8;t++) await page.getByRole("button",{name:"Girar manivela un cuarto de vuelta"}).click();
    await expect(clock).toHaveAttribute("data-clock-solved","true");
    await expect(page.getByText(/La edad sí importa/)).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-reloj-restaurado-desktop.png",fullPage:true,animations:"disabled"});
    await page.getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: "Examinar reloj" }).first().click();
    await expect(page.locator('[data-clock-solved]')).toHaveAttribute("data-clock-solved","true");
    await page.getByRole("button", { name: "Cerrar" }).click();
    for (const person of ["Elías","Mara"]) {
      await page.getByRole("button", { name: "Retrato de "+person }).first().click();
      await page.getByRole("button", { name: "Cerrar" }).click();
    }

    await page.getByRole("button", { name: "Abrir cerradura" }).first().click();
    await expect(page.locator('[data-focus-object="lock"]')).toBeVisible();
    await visualAudit(page,"umbral-cerradura-en-escena-desktop.png");
    await page.screenshot({path:"visual-qa-evidence/umbral-candado-desktop.png",fullPage:true,animations:"disabled"});
    await page.getByText(/USAR TECLADO NUMÉRICO/).click();
    for(const digit of [4,2,7]) await page.getByRole("button",{name:"Ingresar "+digit}).click();
    await page.getByRole("button", { name: "Confirmar código" }).click();
    await expect(page.getByRole("heading", { name: "El despacho", exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("umbral-atmosphere")).toHaveAttribute("data-mood","study");
    await page.screenshot({path:"visual-qa-evidence/umbral-despacho-desktop.png",fullPage:true,animations:"disabled"});

    await page.getByRole("button", { name: "Leer nota" }).first().click();
    await expect(page.getByText(/Primero mirá el cielo/)).toBeVisible();
    await expect(page.getByRole("button",{name:"Dar vuelta la carta"})).toHaveAttribute("aria-pressed","false");
    await page.getByRole("button",{name:"Dar vuelta la carta"}).click();
    await expect(page.getByRole("button",{name:"Volver al frente de la carta"})).toHaveAttribute("aria-pressed","true");
    await page.screenshot({path:"visual-qa-evidence/umbral-carta-reverso.png",fullPage:true,animations:"disabled"});
    await page.getByRole("button",{name:"Volver al frente de la carta"}).click();
    await page.getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: "Vela con la luna" }).first().click();
    await expect(page.locator('svg g[data-candle="luna"]')).toHaveAttribute("data-active","true");
    await expect(page.locator('svg g[data-candle="llave"]')).toHaveAttribute("data-active","false");
    await page.getByRole("button", { name: "Vela con la llave" }).first().click();
    await page.getByRole("button", { name: "Vela con la rosa" }).first().click();
    await page.getByRole("button", { name: "Puerta secreta" }).first().click();
    await expect(page.getByRole("heading", { name: "La habitación de Eva", exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("umbral-atmosphere")).toHaveAttribute("data-mood","nursery");
    await page.screenshot({path:"visual-qa-evidence/umbral-eva-desktop.png",fullPage:true,animations:"disabled"});


    // A real mouse gesture physically removes fog instead of revealing the
    // memory on the first tap. Reopen + expediente must preserve it.
    await page.getByRole("button",{name:"Limpiar espejo empañado"}).first().click();
    const mirror=page.getByTestId("umbral-mirror");
    await expect(mirror).toHaveAttribute("data-revealed","false");
    await visualAudit(page,"umbral-espejo-empanado.png");
    const mirrorCanvas=mirror.locator("canvas");
    await expect(mirrorCanvas).toBeVisible();
    const box=await mirrorCanvas.boundingBox();
    expect(box).toBeTruthy();
    if(!box)throw new Error("The mirror canvas must be measurable");
    for(let row=0;row<7;row++){
      if(await mirror.getAttribute("data-revealed")==="true")break;
      const yy=box.y+box.height*(.13+row*.12);
      await page.mouse.move(box.x+box.width*.12,yy);
      await page.mouse.down();
      await page.mouse.move(box.x+box.width*.88,yy,{steps:12});
      await page.mouse.up();
    }
    await expect(mirror).toHaveAttribute("data-revealed","true",{timeout:4000});
    await expect(mirror.getByText("NO ME", {exact:false})).toBeVisible();
    await visualAudit(page,"umbral-espejo-revelado.png");
    await page.getByRole("button",{name:"Cerrar"}).click();
    await page.getByRole("button",{name:"Limpiar espejo empañado"}).first().click();
    await expect(page.getByTestId("umbral-mirror")).toHaveAttribute("data-revealed","true");
    await page.getByRole("button",{name:"Cerrar"}).click();
    await page.getByRole("button",{name:/Abrir expediente/}).click();
    await expect(page.getByLabel("Documento secreto del espejo")).toContainText("NO ME DEJES ATRÁS");
    await page.getByRole("button",{name:"Cerrar"}).click();

    await page.getByRole("button", { name: "Leer carta" }).first().click();
    await expect(page.getByText(/Seguía con MI, con LA/)).toBeVisible();
    await page.getByRole("button",{name:"Dar vuelta la carta"}).click();
    await expect(page.getByRole("button",{name:"Volver al frente de la carta"})).toHaveAttribute("aria-pressed","true");
    await page.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Examinar muñeca" }).first().click();
    await expect(page.locator('[data-focus-object="doll"][data-focus-room="2"]')).toBeVisible();
    await visualAudit(page,"umbral-muneca-en-escena-desktop.png");
    await expect(page.getByText(/RECUERDO OPCIONAL RECUPERADO/)).toBeVisible();
    await expect(page.getByRole("button",{name:/ESCUCHAR A LA MUÑECA/})).toBeVisible();
    await page.getByRole("button",{name:/ESCUCHAR A LA MUÑECA/}).click();
    await expect(page.getByText(/No apagues la música/)).toBeVisible();
    await expect(page.getByText(/No apagues la música/)).toBeVisible();
    await expect.poll(async()=>page.evaluate(async()=>{const image=new Image();image.src="/escape/images/objects/doll.webp";await image.decode();return image.naturalWidth;})).toBeGreaterThan(300);
    await page.screenshot({path:"visual-qa-evidence/umbral-muneca-cinematografica.png",fullPage:true,animations:"disabled"});
    await page.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Tocar caja musical" }).first().click();
    await expect(page.locator('[data-focus-object="music"]')).toBeVisible();
    for (const note of ["SOL", "MI", "LA", "SOL"]) {
      await page.getByRole("button", { name: note, exact: true }).click();
    }
    await expect(page.getByRole("heading", { name: "La canción de Eva" })).toBeVisible();
    await page.getByRole("button",{name:/REPRODUCIR CINTA 013/}).click();
    await expect(page.getByRole("heading",{name:"El último recuerdo"})).toBeVisible();
    await page.getByRole("button",{name:/PAUSAR CINTA/}).click();
    await expect(page.getByRole("button",{name:/REANUDAR CINTA/})).toBeVisible();
    await page.getByRole("button",{name:/REANUDAR CINTA/}).click();
    await expect(page.getByRole("button",{name:/PAUSAR CINTA/})).toBeVisible();
    const videoResponse=await page.request.get("/escape/images/eva-tape-013.mp4");
    expect(videoResponse.status()).toBe(200);
    expect((await videoResponse.body()).byteLength).toBeGreaterThan(30000);
    await expect(page.locator('video[src*="eva-tape-013.mp4"]')).toHaveCount(1);
    await expect(page.getByText(/CASO 013 \/ CINTA RECUPERADA/)).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-cinta-eva.png",fullPage:true,animations:"disabled"});
    await page.getByRole("button",{name:/GUARDAR LA CINTA/}).click();
    await expect(page.getByRole("heading",{name:"La habitación de Eva",exact:true})).toBeVisible();
    await page.getByRole("button", { name: "Abrir puerta" }).first().click();
    await expect(page.getByRole("heading", { name: "El corazón de la casa", exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("umbral-atmosphere")).toHaveAttribute("data-mood","machine");
    await page.screenshot({path:"visual-qa-evidence/umbral-corazon-desktop.png",fullPage:true,animations:"disabled"});

    await page.getByRole("button", { name: "Fusible 2" }).first().click();
    await expect(page.locator('svg g[data-fuse="2"]')).toHaveAttribute("data-active","true");
    await expect(page.locator('svg g[data-fuse="3"]')).toHaveAttribute("data-active","false");
    await page.getByRole("button", { name: "Fusible 5" }).first().click();
    await page.getByRole("button", { name: "Bajar palanca" }).first().click();
    await expect(page.getByRole("heading", { name: "La última decisión" })).toBeVisible();
    await page.getByRole("button", { name: /VOLVER POR EVA/ }).click();
    await expect(page.getByRole("heading", { name: "No escapaste solo." })).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-final-desktop.png",fullPage:true,animations:"disabled"});
    await expect(page.getByText("PUNTUACIÓN")).toBeVisible();
    await expect(page.getByText(/NUEVO RÉCORD PERSONAL/)).toBeVisible();
    await expect(page.getByText(/ARCHIVO COMPLETO/)).toBeVisible();
    await expect(page.getByText(/Gracias por volver/)).toBeVisible();
    await expect(page.getByText(/MECANISMO RESTAURADO/)).toBeVisible();
    await expect(page.getByRole("button",{name:/Escuchar el agradecimiento/})).toBeVisible();
  });

  test("móvil: objetos accesibles sin depender del panorama, pausa y retorno", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/escape");
    await expect(page.getByRole("button",{name:/BANDA SONORA DINÁMICA ACTIVADA/})).toBeVisible();
    await expect(page.getByRole("button",{name:/EXPERIENCIA DE TERROR CINEMATOGRÁFICO/})).toBeVisible();
    await visualAudit(page,"umbral-intro-mobile-audit.png");
    await page.getByRole("button", { name: /ENTRAR A LA CASA/ }).click();
    await expect(page.getByRole("navigation", { name: "Objetos para investigar" })).toBeVisible();
    await visualAudit(page,"umbral-vestibulo-mobile-sin-linterna.png");
    const torch=page.getByRole("button",{name:"☼ LINTERNA"});
    await torch.click();
    await expect(page.getByRole("button",{name:"◉ APAGAR LUZ"})).toHaveAttribute("aria-pressed","true");
    await visualAudit(page,"umbral-vestibulo-mobile.png");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    await page.getByRole("navigation", { name: "Objetos para investigar" }).getByRole("button", { name: "Abrir cerradura" }).click();
    await expect(page.locator('[data-focus-object="lock"]')).toBeVisible();
    await visualAudit(page,"umbral-cerradura-en-escena-mobile.png");
    await expect(page.getByRole("heading", { name: "Una cerradura sin llave" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: /PAUSAR/ }).last().click();
    await expect(page.getByRole("heading", { name: /Hasta la casa guarda silencio/ })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: /Hasta la casa guarda silencio/ })).toBeVisible();
    await page.getByRole("button", { name: /SEGUIR INVESTIGANDO/ }).click();
    await expect(page.getByRole("heading", { name: "El vestíbulo", exact: true })).toBeVisible();
  });


  test("fondos y objetos Retina: 2x reales, sin ampliación excesiva en un celular de alta densidad",async ({browser})=>{
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors:string[]=[];
    page.on("pageerror",e=>errors.push(e.message));
    // Image.decode resolves relative URLs against the document. The test must
    // navigate away from about:blank before decoding photographic assets.
    await page.goto("/escape");
    const assets=["mansion","room-0","room-1","room-2","room-3"];
    for(const name of assets){
      const path="/escape/images/retina/"+name+".webp";
      const result=await page.request.get(path);
      expect(result.status(),path).toBe(200);
      expect((await result.body()).byteLength,path).toBeGreaterThan(115000);
      const actual=await page.evaluate(async path=>{
        const image=new Image();
        image.src=path;
        await image.decode();
        return [image.naturalWidth,image.naturalHeight];
      },path);
      expect(actual[0],name+" 2x width").toBeGreaterThanOrEqual(2880);
      expect(actual[1],name+" 2x height").toBeGreaterThanOrEqual(1380);
    }
    for(const name of ["clock","lock","doll","music","portrait"]){
      const path="/escape/images/retina/objects/"+name+".webp";
      const result=await page.request.get(path);
      expect(result.status(),path).toBe(200);
      const size=await page.evaluate(async path=>{
        const img=new Image();img.src=path;await img.decode();return img.naturalWidth;
      },path);
      expect(size,name).toBeGreaterThanOrEqual(1500);
    }
    await page.goto("/escape");
    await expect(page.getByRole("heading",{name:/UMBRAL/})).toBeVisible();
    await visualAudit(page,"umbral-mansion-retina-mobile.png");
    await page.getByRole("button",{name:/ENTRAR A LA CASA/}).click();
    await expect(page.getByRole("heading",{name:"El vestíbulo",exact:true})).toBeVisible();
    const roomBackdrop=page.locator('[data-room="0"]').first();
    const roomCss=await roomBackdrop.evaluate(el=>getComputedStyle(el).backgroundImage);
    expect(roomCss).toContain("retina/room-0.webp");
    await page.waitForFunction(()=>
      performance.getEntriesByType("resource").some(e=>e.name.includes("/retina/room-0.webp"))
    ,{timeout:15000});
    await visualAudit(page,"umbral-vestibulo-retina-mobile.png");
    await page.getByRole("navigation",{name:"Objetos para investigar"}).getByRole("button",{name:"Abrir cerradura"}).click();
    const focusImage=await page.locator('[data-focus-object="lock"] [data-material="lock"]').locator("div").first().evaluate(el=>getComputedStyle(el).backgroundImage);
    expect(focusImage).toContain("retina/objects/lock.webp");
    await visualAudit(page,"umbral-cerradura-retina-mobile.png");
    expect(errors).toEqual([]);
    await context.close();
  });

  test("cerradura física: tres tambores metálicos resuelven el código sin teclado",async ({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto("/escape");
    await page.getByRole("button",{name:/ENTRAR A LA CASA/}).click();
    await page.getByRole("navigation",{name:"Objetos para investigar"}).getByRole("button",{name:"Abrir cerradura"}).click();
    await expect(page.locator('[data-focus-object="lock"]')).toBeVisible();
    await expect(page.locator('[data-lock-dials]')).toBeVisible();
    for(const [index,digit] of [4,2,7].entries()){
      for(let t=0;t<digit;t++) await page.getByRole("button",{name:"Girar dial "+(index+1)+" hacia adelante"}).click();
    }
    await expect(page.locator('input[aria-label="Código de tres cifras"]')).toHaveValue("427");
    await visualAudit(page,"umbral-candado-mecanico-movil.png");
    await page.getByRole("button",{name:/GIRAR LA LLAVE/}).click();
    await expect(page.getByRole("heading",{name:"El despacho",exact:true})).toBeVisible({timeout:7000});
  });

  test("código incorrecto no abre la puerta", async ({ page }) => {
    await page.goto("/escape");
    await page.getByRole("button", { name: /ENTRAR A LA CASA/ }).click();
    await page.getByRole("button", { name: "Abrir cerradura" }).first().click();
    await page.getByText(/USAR TECLADO NUMÉRICO/).click();
    await page.getByRole("textbox", { name: "Código de tres cifras" }).fill("123");
    await page.getByRole("button", { name: /DESBLOQUEAR/ }).click();
    await expect(page.getByRole("heading", { name: "El vestíbulo", exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Código de tres cifras" })).toHaveValue("");
  });
  test("el reloj respeta tiempo real, segundo plano y pausa", async ({ page }) => {
    await page.clock.install({time:new Date("2026-10-09T21:00:00Z")});
    await page.goto("/escape");
    await page.getByRole("button", { name: /ENTRAR A LA CASA/ }).click();
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
    await page.getByRole("button",{name:/ENTRAR A LA CASA/}).click();
    await expect(page.getByText("12:00")).toBeVisible();
    await page.getByRole("button",{name:"Pausar partida"}).click();
    await page.reload();
    await expect(page.getByRole("heading",{name:/Hasta la casa guarda silencio/})).toBeVisible();
    await page.getByRole("button",{name:/SEGUIR INVESTIGANDO/}).click();
    await expect(page.getByText("MODO PESADILLA")).toBeVisible();
  });

  test("el apagón narrativo tapa el juego, muestra la presencia y permite omitirlo", async ({ page }) => {
    await page.clock.install({time:new Date("2026-10-09T21:00:00Z")});
    await page.goto("/escape");
    await expect(page.getByRole("button",{name:/EXPERIENCIA DE TERROR CINEMATOGRÁFICO/})).toHaveAttribute("aria-pressed","true");
    await page.getByRole("button",{name:/ENTRAR A LA CASA/}).click();
    await page.getByRole("button",{name:"Abrir cerradura"}).first().click();
    await page.getByText(/USAR TECLADO NUMÉRICO/).click();
    await page.getByRole("textbox",{name:"Código de tres cifras"}).fill("427");
    await page.getByRole("button",{name:/DESBLOQUEAR/}).click();
    await expect(page.getByRole("heading",{name:"El despacho",exact:true})).toBeVisible({timeout:5000});
    for(const name of ["Vela con la luna","Vela con la llave","Vela con la rosa"]) {
      await page.getByRole("button",{name}).first().click();
    }
    await page.getByRole("button",{name:"Puerta secreta"}).first().click();
    await expect(page.getByRole("heading",{name:"La habitación de Eva",exact:true})).toBeVisible({timeout:5000});
    await page.clock.fastForward(6100);
    await expect(page.getByRole("dialog",{name:"Apagón inesperado en la casa"})).toBeVisible();
    await page.clock.fastForward(2300);
    await expect(page.getByText("NO APAGUES LA MÚSICA.")).toBeVisible();
    await page.getByRole("button",{name:/OMITIR SUSTO/}).click();
    await expect(page.getByRole("dialog",{name:"Apagón inesperado en la casa"})).toHaveCount(0);
    await expect(page.getByRole("heading",{name:"La habitación de Eva",exact:true})).toBeVisible();
  });

  test("el modo terror suave evita el apagón y mantiene los controles", async ({ page }) => {
    await page.clock.install({time:new Date("2026-10-09T21:00:00Z")});
    await page.goto("/escape");
    await page.getByRole("button",{name:/EXPERIENCIA DE TERROR CINEMATOGRÁFICO/}).click();
    await expect(page.getByRole("button",{name:/TERROR SUAVE/})).toHaveAttribute("aria-pressed","false");
    await page.getByRole("button",{name:/ENTRAR A LA CASA/}).click();
    await expect(page.getByRole("heading",{name:"El vestíbulo",exact:true})).toBeVisible();
    await expect(page.getByRole("dialog",{name:"Apagón inesperado en la casa"})).toHaveCount(0);
    await page.getByRole("button",{name:"Pausar partida"}).click();
    await expect(page.getByRole("heading",{name:/Hasta la casa guarda silencio/})).toBeVisible();
  });


  test("la música original es opcional y el contador acelera hasta diez segundos", async ({page})=>{
    await page.clock.install({time:new Date("2026-10-09T21:00:00Z")});
    await page.setViewportSize({width:390,height:844});
    await page.goto("/escape");
    const soundtrack=page.getByRole("button",{name:/BANDA SONORA DINÁMICA ACTIVADA/});
    await expect(soundtrack).toHaveAttribute("aria-pressed","true");
    await soundtrack.click();
    await expect(page.getByRole("button",{name:/BANDA SONORA DESACTIVADA/})).toHaveAttribute("aria-pressed","false");
    await page.getByRole("button",{name:/12 MIN/}).click();
    await page.getByRole("button",{name:/ENTRAR A LA CASA/}).click();
    const musicButton=page.getByRole("button",{name:"Activar música"});
    await expect(musicButton).toHaveAttribute("aria-pressed","false");
    await musicButton.click();
    await expect(page.getByRole("button",{name:"Silenciar música"})).toHaveAttribute("aria-pressed","true");
    await expect(page.getByText("12:00")).toBeVisible();
    await page.clock.fastForward(420_000);
    await expect(page.getByText("05:00")).toBeVisible();
    await expect(page.getByText("EL TIEMPO SE AGOTA")).toBeVisible();
    await page.clock.fastForward(290_000);
    await expect(page.getByText("00:10")).toBeVisible();
    await expect(page.getByText("ÚLTIMOS SEGUNDOS")).toBeVisible();
    await expect(page.getByLabel("Quedan 10 segundos")).toBeVisible();
    await page.screenshot({path:"visual-qa-evidence/umbral-final-ten-seconds-mobile.png",fullPage:true,animations:"disabled"});
    await page.clock.fastForward(1_000);
    await expect(page.getByLabel("Quedan 9 segundos")).toBeVisible();
    await page.clock.fastForward(9_000);
    await expect(page.getByRole("heading",{name:"La casa te recordó."})).toBeVisible();
  });

  test("la música se atenúa cuando se pausa y vuelve con la partida",async ({page})=>{
    await page.clock.install({time:new Date("2026-10-09T21:00:00Z")});
    await page.goto("/escape");
    await page.getByRole("button",{name:/ENTRAR A LA CASA/}).click();
    await expect(page.getByRole("button",{name:"Silenciar música"})).toBeVisible();
    await page.getByRole("button",{name:"Pausar partida"}).click();
    await expect(page.getByRole("heading",{name:/Hasta la casa guarda silencio/})).toBeVisible();
    await page.clock.fastForward(31_000);
    await expect(page.getByText("25:00")).toBeVisible();
    await page.getByRole("button",{name:/SEGUIR INVESTIGANDO/}).click();
    await page.clock.fastForward(1_000);
    await expect(page.getByText("24:59")).toBeVisible();
    await page.getByRole("button",{name:"Silenciar música"}).click();
    await expect(page.getByRole("button",{name:"Activar música"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Silenciar",exact:true})).toBeVisible();
  });

});
