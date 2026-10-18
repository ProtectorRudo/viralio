import {mkdirSync} from "node:fs";
import {test,expect,type Page} from "@playwright/test";

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
  page.on("pageerror",err=>failures.push(err.message));
  await page.goto("/donde-estas-mama");
  const compatible=await page.evaluate(()=>Boolean(document.createElement("canvas").getContext("webgl2")));
  test.skip(!compatible,"The runner has no WebGL2 implementation");
  await expect(page.locator(".mom-world canvas")).toHaveCount(1);
  await page.getByRole("button",{name:/ENTRAR A LA CASA/}).click();
  await expect(page.locator(".mom-time")).toHaveText(/0[45]:[0-5]\d/);

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

  await interact(2.35,1.5,-1.45,/Perchero/);
  await expect(page.getByText(/ENCONTRASTE UNA LLAVE/)).toBeVisible();
  await interact(0,1.5,-3.67,/Puerta de la sala/);
  await expect(page.locator(".mom-location")).toContainText("SALA FAMILIAR");
  reset(1);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-room-2.png"});

  await interact(-2.35,1.65,-11.5,/Fotografía familiar/);
  for(const [piece,turns] of [[1,3],[2,1],[3,2],[4,3]] as const){
    for(let i=0;i<turns;i++){
      await page.getByRole("button",{name:"Girar pieza "+piece}).click();
    }
  }
  await expect(page.getByText(/FOTOGRAFÍA RECONSTRUIDA/)).toBeVisible();

  await interact(2.4,1.5,-9.3,/Biblioteca/);
  for(const color of ["rojo","dorado","azul"]){
    await page.getByRole("button",{name:"Presionar libro "+color}).click();
  }
  await expect(page.getByText(/COMPARTIMIENTO ABIERTO/)).toBeVisible();

  await interact(0,1.5,-11.67,/Puerta del dormitorio/);
  await expect(page.locator(".mom-location")).toContainText("DORMITORIO");
  reset(2);
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-room-3.png"});

  await interact(-2.5,1,-17.4,/Caja de juguetes/);
  await interact(-2.5,1,-14.6,/Mesa de luz/);
  await interact(2.4,1.45,-17.1,/Estante/);
  await expect(page.locator(".mom-inventory")).toContainText("3/3");

  await interact(1.5,1.05,-14.65,/Caja musical/);
  for(const gear of ["grande","mediano","pequeño"]){
    await page.getByRole("button",{name:"⚙ "+gear}).click();
  }
  await expect(page.getByText(/LA CAJA MUSICAL FUNCIONA/)).toBeVisible();
  await interact(0,1.5,-18.69,/Armario cerrado/);
  await expect(page.locator(".mom-reveal")).toBeVisible();
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-reveal.png"});
  await expect(page.getByRole("heading",{name:/Feliz día/})).toBeVisible({timeout:10000});
  await expect(page.getByText(/UNA CARTA PARA VOS/)).toBeVisible();
  await page.screenshot({path:"visual-qa-evidence/mother-mobile-ending.png"});
  expect(failures).toEqual([]);
});
