import {mkdirSync,writeFileSync} from "node:fs";
import {test,expect} from "@playwright/test";

mkdirSync("visual-qa-evidence",{recursive:true});

/**
 * Runs the complete production UI, including raycast interactions, without any QA
 * shortcut or synthetic access to React state. Positions correspond to authored
 * hit targets in MotherWorld and movements are real mouse gestures.
 */
test("mother's day: full 3-room rescue, physical interactions and emotional ending",async({page})=>{
  test.setTimeout(120_000);
  await page.setViewportSize({width:390,height:844});
  const failures:string[]=[];
  const assetErrors:string[]=[];
  const loadedChildResponses:number[]=[];
  page.on("pageerror",err=>failures.push(err.message));
  page.on("response",res=>{
    if(res.url().includes("/viralio-3d/")&&res.status()>=400)assetErrors.push(res.status()+" "+res.url());
    if(res.url().includes("/viralio-3d/models/mother-child-eli.glb"))loadedChildResponses.push(res.status());
  });
  await page.goto("/donde-estas-mama");
  const compatible=await page.evaluate(()=>Boolean(document.createElement("canvas").getContext("webgl2")));
  expect(compatible,"Chromium must render WebGL2; a skipped 3D test is not a pass").toBe(true);
  await expect(page.locator(".mom-world canvas")).toHaveCount(1);
  await page.getByRole("button",{name:/ENTRAR A LA CASA/}).click();
  const introCard=page.getByRole("dialog",{name:/Encontrá la llave que abre la primera puerta/});
  await expect(introCard).toBeVisible();
  await expect(introCard.getByText("PRIMERA PISTA")).toBeVisible();
  await expect(introCard.getByText(/Examiná los objetos de la habitación/)).toBeVisible();
  await expect(page.locator(".mom-time")).toHaveCount(0);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-first-clue.png"});
  await introCard.getByRole("button",{name:/EMPEZAR BÚSQUEDA/}).click();
  await expect(introCard).toHaveCount(0);
  await expect(page.locator(".mom-time")).toHaveText(/0[45]:[0-5]\d/);
  const renderStats=await page.evaluate(async()=>{
    const canvas=document.querySelector<HTMLCanvasElement>(".mom-world canvas");
    const pixels={width:canvas?.width||0,height:canvas?.height||0};
    const resolution={width:canvas?.clientWidth||0,height:canvas?.clientHeight||0};
    const fps=await new Promise<number>(resolve=>{
      let frames=0;const start=performance.now();
      const tick=(now:number)=>{
        if(now-start>=2000){resolve(Math.round(frames*1000/(now-start)));return;}
        frames++;requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return {viewport:resolution,canvasPixels:pixels,framesPerSecondInHeadlessChromium:fps,note:"CI software renderer, not measured on physical phone"};
  });
  writeFileSync("visual-qa-evidence/mother-browser-performance.json",JSON.stringify(renderStats,null,2),"utf8");
  await expect(page.locator(".mom-reticle")).toBeVisible();
  await expect(page.locator('.mom-joystick')).toBeVisible();
  await expect(page.locator('.mom-pad')).toHaveCount(0);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-room-1.png"});
  // Optional hints escalate slowly; early clicks must not disclose the hiding place.
  const hintButton=page.getByRole("button",{name:/¿PISTA?/});
  await hintButton.click();
  await expect(page.locator(".mom-hint-panel")).toContainText("PISTA 1 DE 3");
  await expect(page.locator(".mom-hint-panel")).not.toContainText(/almohada|cama|perchero/i);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-subtle-hint.png"});
  await page.getByRole("button",{name:"Cerrar pista"}).click();
  await hintButton.click();
  await expect(page.locator(".mom-hint-panel")).toContainText("PISTA 2 DE 3");
  await expect(page.locator(".mom-hint-panel")).not.toContainText(/almohada|cama|perchero/i);
  await page.getByRole("button",{name:"Cerrar pista"}).click();


  // Stage-local physical placements. The camera is reset at each doorway.
  const camera={x:0,y:1.65,z:2.25,yaw:0,pitch:-.04};
  const reset=(room:0|1|2)=>{
    camera.x=0;camera.y=1.65;camera.z=2.25-room*8;
    camera.yaw=0;camera.pitch=-.04;
  };
  const lookAt=async(x:number,y:number,z:number)=>{
    const azimuth=-Math.atan2(x-camera.x,-(z-camera.z));
    const pitch=Math.atan2(y-camera.y,Math.hypot(x-camera.x,z-camera.z));
    const totalX=-(azimuth-camera.yaw)/.0043;
    const totalY=-(pitch-camera.pitch)/.0035;
    const segments=Math.max(1,Math.ceil(Math.max(Math.abs(totalX)/130,Math.abs(totalY)/90)));
    const stepX=totalX/segments,stepY=totalY/segments;
    for(let n=0;n<segments;n++){
      const cx=195,cy=418;
      await page.mouse.move(cx,cy);
      await page.mouse.down();
      await page.mouse.move(cx+stepX,cy+stepY,{steps:4});
      await page.mouse.up();
    }
    camera.yaw=azimuth;camera.pitch=pitch;
  };
  const interact=async(x:number,y:number,z:number,label:RegExp)=>{
    await lookAt(x,y,z);
    await expect(page.locator(".mom-focus")).toContainText(label,{timeout:9000});
    await page.keyboard.press("e");
  };

  // The old perchero is now a decoy, not an instant win.
  await interact(3.02,1.5,2.34,/Perchero/);
  await expect(page.getByText(/Solo hay algunos abrigos/)).toBeVisible();
  await expect(page.locator(".mom-inventory")).not.toContainText("Llave");

  await interact(3.12,.7,.48,/Mochila/);
  await expect(page.getByText(/donde empiezan mis sueños/)).toBeVisible();
  await interact(2.05,.88,-1.08,/Cama desordenada/);
  const bed=page.getByRole("dialog",{name:"Examinar objeto"});
  await expect(bed.getByRole("heading",{name:/Una cama sin hacer/})).toBeVisible();
  await bed.getByRole("button",{name:/REVISAR LA MANTA/}).click();
  await expect(bed.getByText(/No encontrás ninguna llave/)).toBeVisible();
  await bed.getByRole("button",{name:/LEVANTAR LA ALMOHADA/}).click();
  await expect(bed).toHaveCount(0);
  await expect(page.locator(".mom-inventory")).not.toContainText("Llave");
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-hidden-key-revealed.png"});
  await interact(2.14,.6,-2.42,/Llave pequeña/);
  await expect(page.getByText(/ENCONTRASTE UNA LLAVE/)).toBeVisible();
  await expect(page.locator(".mom-inventory")).toContainText("Llave");
  await interact(0,1.5,-3.67,/Puerta de la sala/);
  await expect(page.locator(".mom-location")).toContainText("SALA FAMILIAR");
  reset(1);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-room-2.png"});

  await interact(-2.35,1.65,-11.5,/Fotografía familiar/);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-new-photo-puzzle.png"});
  // Merely rotating pieces is no longer enough: two pairs are out of place.
  for(const [piece,turns] of [[1,1],[2,3],[3,3],[4,2]] as const){
    for(let i=0;i<turns;i++){
      await page.getByRole("button",{name:"Girar pieza "+piece}).click();
    }
  }
  await expect(page.getByRole("heading",{name:/Los fragmentos del recuerdo/})).toBeVisible();
  for(const [a,b] of [[1,2],[3,4]] as const){
    await page.getByRole("button",{name:"Seleccionar pieza "+a}).click();
    await page.getByRole("button",{name:"Seleccionar pieza "+b}).click();
  }
  await expect(page.getByText(/FOTOGRAFÍA RECONSTRUIDA/)).toBeVisible();

  await interact(2.65,1.5,-9.33,/Biblioteca/);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-four-book-riddle.png"});
  // Interpret hojas→verde, corazón→rojo, sol→dorado, cielo→azul.
  for(const color of ["verde","rojo","dorado","azul"]){
    await page.getByRole("button",{name:"Presionar libro "+color}).click();
  }
  await expect(page.getByText(/COMPARTIMIENTO ABIERTO/)).toBeVisible();

  await interact(0,1.5,-11.67,/Puerta del dormitorio/);
  await expect(page.locator(".mom-location")).toContainText("DORMITORIO");
  reset(2);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-room-3.png"});

  await interact(-2.55,.96,-16.93,/Caja de juguetes/);
  await interact(-2.65,.98,-14.32,/Mesa de luz/);
  await interact(2.62,1.45,-16.94,/Estante/);
  await expect(page.locator(".mom-inventory")).toContainText("3/3");

  await interact(2.45,1.05,-14.37,/Caja musical/);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-music-box-puzzle.png"});
  for(const gear of ["grande","mediano","pequeño"]){
    await page.getByRole("button",{name:"⚙ "+gear}).click();
  }
  await expect(page.getByText(/LA CAJA MUSICAL FUNCIONA/)).toBeVisible();
  await interact(0,1.5,-18.69,/Armario cerrado/);
  await expect(page.locator(".mom-reveal")).toBeVisible();
  // Render after the wardrobe has finished moving: screenshot now includes the child.
  await page.waitForTimeout(2300);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-reveal.png"});
  await expect(page.getByRole("heading",{name:/Feliz día/})).toBeVisible({timeout:10000});
  await expect(page.getByText(/UNA CARTA PARA VOS/)).toBeVisible();
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-ending.png"});
  expect(failures).toEqual([]);
  expect(assetErrors).toEqual([]);
  expect(loadedChildResponses,"The published child GLB must really download in the playable scene").toContain(200);
});
