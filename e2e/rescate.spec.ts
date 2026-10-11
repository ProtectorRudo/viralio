import {test,expect,type Page} from "@playwright/test";
import {ROOM_LAYOUT} from "../src/app/escape/rescate/RescueWorld";
import {mkdirSync} from "node:fs";

mkdirSync("visual-qa-evidence",{recursive:true});
async function start(page:Page){
 await page.goto("/rescate-mauro/");
 await expect(page.getByRole("heading",{name:/SECUESTRARON/})).toBeVisible();
 await page.getByRole("button",{name:/INICIAR RESCATE/}).click();
 await expect(page.getByTestId("rescate-mauro-app")).toHaveAttribute("data-stage","game");
 await expect(page.getByTestId("rescate-timer")).toContainText(/0[23]:[0-5][0-9]/);
 const canvas=page.getByTestId("rescate-webgl");
 await expect(canvas).toBeVisible();
 await expect.poll(()=>canvas.evaluate((n)=>{
  const c=n as HTMLCanvasElement;
  const gl=c.getContext("webgl");
  return Boolean(gl&&c.width>200&&c.height>200&&gl.getParameter(gl.VERSION).includes("WebGL"));
 })).toBe(true);
}
async function walk(page:Page,key:string,ms:number){
 await page.keyboard.down(key);
 await page.waitForTimeout(ms);
 await page.keyboard.up(key);
}
/** Hold the walk control until the real 3D camera reaches a coordinate.
    Headless software WebGL can render slowly, so a fixed 2-second walk is
    not a portable assertion of distance traveled. */
async function walkTo(page:Page,key:string,axis:"x"|"z",bound:number,direction:"below"|"above"="below"){
 await page.keyboard.down(key);
 try{
  const position=()=>page.getByTestId("rescate-webgl").getAttribute("data-camera-"+axis).then(x=>x===null?NaN:Number(x));
  if(direction==="below")await expect.poll(position,{timeout:20000,intervals:[125,250,450]}).toBeLessThan(bound);
  else await expect.poll(position,{timeout:20000,intervals:[125,250,450]}).toBeGreaterThan(bound);
 }finally{await page.keyboard.up(key)}
}
async function examineNearby(page:Page,name:string){
 const nearby=page.getByTestId("rescate-nearby");
 if(!(await nearby.isVisible()))await page.getByRole("button",{name:/OBJETOS CERCANOS/}).click();
 await expect(nearby).toBeVisible();
 await nearby.getByRole("button",{name:new RegExp(name,"i")}).click({timeout:12000});
 await expect(page.getByRole("dialog")).toBeVisible();
}

test("CASO M · intruso 3D rigged con materiales PBR y animación al caminar",async({page})=>{
 await start(page);
 const canvas=page.getByTestId("rescate-webgl");
 await expect.poll(()=>canvas.getAttribute("data-cinematic-intruder"),{timeout:18000}).toBe("ready");
 await expect(canvas).toHaveAttribute("data-cinematic-model","skinned-glb");
 const cinematic=page.locator('[data-testid="rescate-cinematic-canvas"]');
 await expect(cinematic).toBeVisible();
 for(let second=0;second<135;second++)await page.clock.fastForward(1000);
 await expect.poll(()=>canvas.getAttribute("data-intruder-visible"),{timeout:8000}).toBe("yes");
 await expect.poll(()=>canvas.getAttribute("data-intruder-animation"),{timeout:8000}).toBe("walk");
 await expect.poll(()=>canvas.getAttribute("data-intruder-approach").then(Number),{timeout:8000}).toBeGreaterThan(.14);
 // A single GPU model must replace (not overlay) the old polygonal figure.
 await expect(page.locator('[data-testid="rescate-cinematic-canvas"]')).toHaveCount(1);
});

test("CASO M · muebles separados, pasillos despejados y puntos físicos coherentes",async({page})=>{
 const {recorder,surveillance,lock,locker,trunk}=ROOM_LAYOUT;
 const clearGap=(a:{x:number;z:number;w:number;d:number},b:{x:number;z:number;w:number;d:number})=>
  Math.hypot(Math.max(0,Math.abs(a.x-b.x)-(a.w+b.w)/2),Math.max(0,Math.abs(a.z-b.z)-(a.d+b.d)/2));
 expect(clearGap(recorder,lock)).toBeGreaterThan(1);
 expect(clearGap(surveillance,lock)).toBeGreaterThan(1);
 expect(clearGap(recorder,locker)).toBeGreaterThan(2);
 expect(clearGap(recorder,trunk)).toBeGreaterThan(1);
 await start(page);
 const canvas=page.getByTestId("rescate-webgl");
 // The central aisle must still allow the player to advance from the doorway.
 await walkTo(page,"w","z",-1.03);
 expect(Number(await canvas.getAttribute("data-camera-x"))).toBeCloseTo(0,1);
 await examineNearby(page,"Grabador de voz");
 await expect(page.getByTestId("rescate-voice")).toBeVisible();
});
 
test("CASO M · introducción cinematográfica y expediente plegable",async({page})=>{
 await page.goto("/rescate-mauro/");
 await expect(page.getByRole("button",{name:/INICIAR RESCATE/})).toBeVisible();
 await page.getByRole("button",{name:/INICIAR RESCATE/}).click();
 await expect(page.getByTestId("rescate-mauro-app")).toHaveAttribute("data-stage","game",{timeout:9000});
 const dossier=page.getByTestId("rescate-dossier-toggle");
 await expect(dossier).toHaveAttribute("aria-expanded","false");
 await dossier.click();
 await expect(dossier).toHaveAttribute("aria-expanded","true");
});

test("CASO M · verdadera escena WebGL 3D, joystick y contador de tres minutos",async({page},testInfo)=>{
 await start(page);
 const canvas=page.getByTestId("rescate-webgl");
 await page.waitForTimeout(500);
 const sample=await canvas.evaluate(node=>{
  const c=node as HTMLCanvasElement,gl=c.getContext("webgl")!,rgba=new Uint8Array(4);
  gl.readPixels(Math.floor(c.width*.5),Math.floor(c.height*.5),1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
  return Array.from(rgba);
 });
 expect(sample[3]).toBe(255);
 await expect(page.getByTestId("rescate-joystick")).toBeVisible();
 await walk(page,"w",900);
 await page.screenshot({path:`visual-qa-evidence/rescate-mauro-3d-${testInfo.project.name}.png`,fullPage:true});
});

test("CASO M · toque directo sobre el cajón abre el candado",async({page},testInfo)=>{
 await start(page);
 const canvas=page.getByTestId("rescate-webgl");
 const bounds=await canvas.boundingBox();
 expect(bounds).not.toBeNull();
 const x=bounds!.x+bounds!.width*.5,y=bounds!.y+bounds!.height*.598;
 if(testInfo.project.use.hasTouch)await page.touchscreen.tap(x,y);
 else await page.mouse.click(x,y);
 await expect(page.getByRole("dialog",{name:/Candado de seis cifras/})).toBeVisible();
});


test("CASO M · al minuto final aparece la advertencia y luego el intruso",async({page},testInfo)=>{
 test.setTimeout(150000);
 await page.clock.install();
 await start(page);
 // Freeze the wall clock first: real browser rendering must not consume time
 // while we advance game ticks for the 60-second event.
 const now=await page.evaluate(()=>Date.now());
 await page.clock.pauseAt(new Date(now+10000));
 const read=await page.getByTestId("rescate-timer").innerText();
 const parts=read.match(/([0-9]{2}):([0-9]{2})/);
 expect(parts).not.toBeNull();
 const remaining=Number(parts![1])*60+Number(parts![2]);
 for(let j=0;j<Math.max(0,remaining-60);j++)await page.clock.fastForward(1000);
 await expect(page.getByTestId("rescate-timer")).toContainText("01:00");
 await expect(page.getByTestId("rescate-blackout")).toBeVisible();
 await page.clock.fastForward(1900);
 await expect(page.getByTestId("rescate-blackout")).toHaveCount(0);
 await expect(page.getByTestId("rescate-graffiti-reveal")).toContainText("SEGUÍS VOS.");
 await expect(page.getByTestId("rescate-graffiti-wall")).toContainText("SEGUÍS");
 await expect(page.getByTestId("rescate-intruder-alert")).toBeVisible();
 for(let j=0;j<10;j++)await page.clock.fastForward(1000);
 await expect(page.getByTestId("rescate-knife-alert")).toBeVisible();
 await expect(page.getByTestId("rescate-knife-alert")).toContainText("NO ESTÁS SOLO");
 // The attacker must CROSS the threshold — previous version moved only 25cm.
 for(let k=0;k<27;k++)await page.clock.fastForward(1000);
 await expect.poll(()=>page.getByTestId("rescate-webgl").getAttribute("data-intruder-approach").then(v=>Number(v||0)),{timeout:8000}).toBeGreaterThan(.35);
 await page.screenshot({path:`visual-qa-evidence/rescate-intruso-${testInfo.project.name}.png`,fullPage:true});
});

test("CASO M · grabadora usa MP3 real y reproduce sonido en Android",async({page})=>{
 test.setTimeout(85000);
 await start(page);
 const recording=page.getByTestId("rescate-tape-audio");
 await expect.poll(()=>recording.evaluate(node=>(node as HTMLAudioElement).readyState),{timeout:15000}).toBeGreaterThanOrEqual(2);
 await walkTo(page,"w","z",-1.03);
 await examineNearby(page,"Grabador de voz");
 const play=page.getByTestId("rescate-play-tape");
 await expect(play).toBeVisible();
 await play.click();
 await expect.poll(()=>recording.evaluate(node=>(node as HTMLAudioElement).currentTime),{timeout:10000}).toBeGreaterThan(0);
 await expect(recording.locator("source").first()).toHaveAttribute("src","./audio/mauro-voice.webm");
 await expect.poll(()=>recording.evaluate(el=>(el as HTMLAudioElement).currentSrc),{timeout:9000}).toContain("mauro-voice.webm");
});

test("CASO M · música cinematográfica real comienza al aceptar misión",async({page})=>{
 await start(page);
 const music=page.getByTestId("rescate-music-audio");
 await expect(music).toHaveAttribute("src","./audio/suspense.wav");
 await expect.poll(()=>music.evaluate(el=>(el as HTMLAudioElement).readyState),{timeout:20000}).toBeGreaterThanOrEqual(2);
 await expect.poll(()=>music.evaluate(el=>(el as HTMLAudioElement).currentTime),{timeout:10000}).toBeGreaterThan(.15);
 await expect(page.getByRole("button",{name:"MÚSICA ON"})).toBeVisible();
 await page.getByRole("button",{name:"MÚSICA ON"}).click();
 await expect(page.getByRole("button",{name:"SONIDO OFF"})).toBeVisible();
});

test("CASO M · ayuda gradual visible y reloj 3D accionable se detiene a las 17:00",async({page})=>{
 test.setTimeout(95000);
 await start(page);
 await page.getByTestId("rescate-hint-button").click();
 const help=page.getByTestId("rescate-hint-panel");
 await expect(help).toBeVisible();
 await expect(help).toContainText("PISTA ÚNICA");
 await expect(help).toContainText("fotografía");
 await expect(help.getByRole("button",{name:/PEDIR OTRA PISTA/})).toHaveCount(0);
 await help.getByRole("button",{name:"Cerrar pista"}).click();
 await expect(help).toBeHidden();
 await page.getByTestId("rescate-hint-button").click();
 await expect(help).toContainText("PISTA ÚNICA");
 await expect(help.getByRole("button",{name:/PEDIR OTRA PISTA/})).toHaveCount(0);
 await help.getByRole("button",{name:"Cerrar pista"}).click();
 await walkTo(page,"d","x",3.0,"above");
 await walkTo(page,"w","z",-2.26);
 await examineNearby(page,"Reloj del interrogatorio");
 const clock=page.getByTestId("rescate-clock");
 await expect(clock).toHaveAttribute("data-clock","idle");
 await clock.getByRole("button",{name:/ACTIVAR Y GIRAR LAS AGUJAS/}).click();
 await expect(clock).toHaveAttribute("data-clock","running");
 await expect(clock).toHaveAttribute("data-clock","done",{timeout:11000});
 await expect(clock).toContainText("17:00 HS");
 await page.getByRole("button",{name:"VOLVER A LA SALA"}).click();
 await examineNearby(page,"Reloj del interrogatorio");
 await expect(page.getByTestId("rescate-clock")).toHaveAttribute("data-clock","done");
});

test("CASO M · pistas físicas, combinación 131026, cajón y sobre revelan cumpleaños",async({page})=>{
 test.setTimeout(140000);
 await page.goto("/rescate-mauro/?fecha=13%20de%20octubre&hora=20%3A00&lugar=La%20Plata");
 await page.getByRole("button",{name:/INICIAR RESCATE/}).click();
 await expect(page.getByTestId("rescate-webgl")).toBeVisible();
 await walkTo(page,"w","z",-1.03);
 await examineNearby(page,"Grabador de voz");
 await expect(page.getByRole("dialog")).toContainText("10");
 await page.getByRole("button",{name:/GUARDAR EVIDENCIA/}).click();
 await expect(page.getByText(/PRUEBAS 1\/3/)).toBeVisible();
 await examineNearby(page,"Archivo de vigilancia");
 await expect(page.getByTestId("rescate-surveillance")).toBeVisible();
 await expect(page.getByRole("dialog")).toContainText("2026");
 await page.getByRole("button",{name:/GUARDAR EVIDENCIA/}).click();
 await walkTo(page,"a","x",-2.13);
 await walkTo(page,"w","z",-2.35);
 await examineNearby(page,"Fotografía dañada");
 const photograph=page.getByTestId("rescate-photo");
 await expect(photograph.locator("svg[role='img']")).toBeVisible();
 await page.getByTestId("rescate-photo").getByRole("button",{name:/DAR VUELTA/}).click();
 await expect(page.getByRole("dialog")).toContainText("XIII");
 await page.getByRole("button",{name:/GUARDAR EVIDENCIA/}).click();
 await expect(page.getByText(/PRUEBAS 3\/3/)).toBeVisible();
 const dossier=page.getByTestId("rescate-dossier-toggle");
 await expect(dossier).toHaveAttribute("aria-expanded","true");
 const slips=page.getByTestId("rescate-evidence-slip");
 await expect(slips).toHaveCount(3);
 for(let i=0;i<3;i++){
  const card=await slips.nth(i).boundingBox();
  expect(card).not.toBeNull();
  expect(card!.width).toBeGreaterThan(150);
  expect(card!.height).toBeGreaterThan(40);
  if(i>0){
   const previous=await slips.nth(i-1).boundingBox();
   expect(card!.y).toBeGreaterThanOrEqual(previous!.y+previous!.height-1);
  }
 }
 await expect(slips).toContainText(["Cinta recuperada","Grabación vigilada","Fotografía intervenida"]);
 // Go around the front of the physical table (collision volumes prevent
 // reaching through the tabletop from the calendar side of the room).
 await walkTo(page,"s","z",-1.31,"above");
 await walkTo(page,"d","x",-1.13,"above");
 await expect.poll(async()=>{const n=page.getByTestId("rescate-webgl");return [Number(await n.getAttribute("data-camera-x")),Number(await n.getAttribute("data-camera-z"))];}).toEqual(expect.arrayContaining([expect.any(Number),expect.any(Number)]));
 await examineNearby(page,"Candado del cajón");
 const lock=page.getByTestId("rescate-lock");
 await expect(lock).toBeVisible();
 await page.getByRole("button",{name:"Subir cifra 1"}).click();
 for(let i=0;i<3;i++)await page.getByRole("button",{name:"Subir cifra 2"}).click();
 await page.getByRole("button",{name:"Subir cifra 3"}).click();
 for(let i=0;i<2;i++)await page.getByRole("button",{name:"Subir cifra 5"}).click();
 for(let i=0;i<6;i++)await page.getByRole("button",{name:"Subir cifra 6"}).click();
 await expect(lock.locator('strong[aria-label^="Cifra "]')).toHaveText(["1","3","1","0","2","6"]);
 await page.getByRole("button",{name:/PROBAR COMBINACIÓN/}).click();
 await expect(lock).not.toBeVisible();
 await expect(page.getByText(/ABRISTE EL CAJÓN/)).toBeVisible();
 const beacon=page.getByTestId("rescate-envelope-beacon");
 await expect(beacon).toBeVisible();
 await expect(beacon).toHaveAttribute("data-anchor-visible","yes");
 await expect(beacon).toHaveAttribute("data-world-distance",/^[0-9]+\.[0-9]{2}$/);
 await expect(beacon).toContainText("AHÍ ESTÁ EL SOBRE");
 await beacon.click();
 await page.getByRole("button",{name:/ROMPER EL LACRE/}).click();
 await expect(page.getByTestId("rescate-letter-inside")).toBeVisible({timeout:9000});
 await page.getByRole("button",{name:/REVELAR MI INVITACIÓN/}).click();
 const finale=page.getByTestId("rescate-invite-final");
 await expect(finale).toBeVisible();
 await expect(finale).toContainText("Una noche para celebrar");
 await expect(finale).toContainText("13 de octubre");
 await expect(finale).toContainText("20:00");
 await expect(finale).toContainText("La Plata");
 await page.screenshot({path:"visual-qa-evidence/rescate-mauro-invitacion-revelada.png",fullPage:true});
});
