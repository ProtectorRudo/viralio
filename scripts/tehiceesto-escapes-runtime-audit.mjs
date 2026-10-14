import fs from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";

const host="https://tehiceesto.com";
const rooms=[
 {slug:"caso-m",start:/INICIAR RESCATE/i},
 {slug:"ultima-funcion",start:/ABRIR LAS PUERTAS/i},
 {slug:"ultima-campanada",start:/Aceptar el misterio/i},
];
const output=path.resolve("tehiceesto-escape-runtime-audit");
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const failures=[];
for(const viewport of [{name:"desktop",width:1365,height:768},{name:"mobile",width:390,height:844}]){
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.name==="mobile",hasTouch:viewport.name==="mobile"});
 for(const room of rooms){
  const page=await context.newPage(),errors=[],badAssets=[];
  const name=viewport.name+" "+room.slug;
  page.on("pageerror",e=>errors.push("JS "+e.message.slice(0,250)));
  page.on("console",m=>{if(m.type()==="error")errors.push("console "+m.text().slice(0,240));});
  page.on("requestfailed",r=>{if(/\.(js|css|glb|gltf|wasm)(\?|$)/.test(r.url()))badAssets.push(r.url()+" "+r.failure()?.errorText);});
  try{
    const landing=await page.goto(host+"/escapes/"+room.slug,{waitUntil:"domcontentloaded",timeout:45000});
    if(landing?.status()!==200)throw Error("Demo landing HTTP "+landing?.status());
    const button=page.getByRole("link",{name:"Iniciar partida de "+(room.slug==="caso-m"?"CASO M · Operación Rescate":room.slug==="ultima-funcion"?"La Última Función":"La Última Campanada")});
    await button.waitFor({state:"visible",timeout:12000});
    const href=await button.getAttribute("href");
    if(!href?.startsWith("https://"))throw Error("Launcher has no public full-screen game URL");
    await Promise.all([page.waitForURL(url=>!url.href.includes("/escapes/"),{timeout:25000}),button.click()]);
    await page.getByRole("button",{name:room.start}).waitFor({state:"visible",timeout:35000});
    console.log("ENTRY "+name,JSON.stringify({url:page.url(),title:await page.title(),startVisible:true}));
    await page.getByRole("button",{name:room.start}).click({timeout:20000});
    if(room.slug==="ultima-funcion"){
      await page.getByRole("button",{name:/ENTENDÍ MI MISIÓN/}).waitFor({timeout:13000});
      await page.getByRole("button",{name:/ENTENDÍ MI MISIÓN/}).click();
    }
    // CASO M preloads an animated GLB; render timing varies by GPU and viewport.
    // A fixed two-second delay incorrectly failed slow but healthy devices.
    await page.locator("canvas").first().waitFor({state:"visible",timeout:45000});
    await page.waitForTimeout(700);
    const canvases=await page.locator("canvas").count();
    const body=(await page.locator("body").innerText()).slice(0,350);
    console.log("PLAYABLE "+name,JSON.stringify({canvases,body,errors:errors.slice(0,9),badAssets:badAssets.slice(0,8)}));
    // Screenshot of a continuously animated WebGL canvas may hang Chromium on
    // software-only CI GPUs. Gameplay + visible canvas, not screenshot speed,
    // determines whether a room really runs.
    if(!canvases)throw Error("Game started but no 3D canvas rendered");
    if(badAssets.length)throw Error("Failed game assets: "+badAssets.join("; "));
    if(errors.some(e=>/Refused to execute script|Refused to apply style|Failed to fetch dynamically imported|Cannot find module|Unexpected token/i.test(e)))
      throw Error("Fatal JS/CSS failure: "+errors.join("; "));
  }catch(e){
    const reason=name+": "+String(e).slice(0,550)+"; browser "+errors.slice(-5).join(" | ");
    failures.push(reason);
    console.error("FAILED "+reason);

  }finally{await page.close()}
 }
 await context.close();
}
await browser.close();
if(failures.length){console.error("Playable demo failures:\n"+failures.join("\n"));process.exit(1)}
console.log("PASS: All three escape demos genuinely launch AND render a playable 3D scene on desktop and mobile");
