import {chromium} from "playwright";
const base="https://tehiceesto.com";
const rooms=[
 {slug:"caso-m",source:"https://tehiceesto.com/escape-play/caso-m/",start:/INICIAR RESCATE|INICIAR OPERACIÓN RESCATE/i},
 {slug:"ultima-funcion",source:"https://la-ultima-funcion.vercel.app/",start:/ABRIR LAS PUERTAS/i},
 {slug:"ultima-campanada",source:"https://la-ultima-campanada-desafio-v6.vercel.app/",start:/Aceptar el misterio/i}
];
const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
for(const viewport of [{name:"desktop",width:1365,height:768},{name:"mobile",width:390,height:844}]){
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.name==="mobile",hasTouch:viewport.name==="mobile"});
 for(const room of rooms){
  const page=await context.newPage();
  const problems=[];
  page.on("pageerror",e=>problems.push("PAGEERR "+e.message.slice(0,250)));
  page.on("console",m=>{if(m.type()==="error")problems.push("CONSOLE "+m.text().slice(0,250));});
  page.on("requestfailed",r=>{if(/\.(js|css|glb|gltf|wasm)(\?|$)/.test(r.url()))problems.push("REQFAIL "+r.url().slice(0,180)+" "+r.failure()?.errorText)});
  let shell;
  try{
   shell=await page.goto(base+"/escapes/"+room.slug,{timeout:45000,waitUntil:"domcontentloaded"});
   await page.waitForTimeout(4000);
   const frames=page.frames().map(f=>({url:f.url(),txt:f.url().startsWith("http")?f.locator("body").innerText({timeout:2000}).catch(()=>"?"):Promise.resolve("-")}));
   const frameDetails=await Promise.all(frames.map(async f=>({...f,txt:(await f.txt).slice(0,220)})));
   console.log("SHELL",viewport.name,room.slug,JSON.stringify({status:shell?.status(),frames:frameDetails,errors:problems.slice(0,12)}));
   if(room.slug==="caso-m"){
    const a=page.getByRole("link",{name:/INICIAR OPERACIÓN RESCATE/}).first();
    console.log("LAUNCH",await a.count(),await a.getAttribute("href"));
    if(await a.count())await Promise.allSettled([page.waitForURL(/escape-play\/caso-m/,{timeout:18000}),a.click({timeout:10000})]);
   }
   await page.waitForTimeout(1800);
   console.log("AFTER",viewport.name,room.slug,JSON.stringify({url:page.url(),frames:page.frames().map(f=>f.url()),body:(await page.locator("body").innerText()).slice(0,280),errors:problems.slice(-15)}));
  }catch(e){console.log("ERROR",viewport.name,room.slug,String(e).slice(0,800));}
  const dir=page.frames();
  let fg=dir.find(f=>f.url().startsWith("https://la-ultima"))||page.mainFrame();
  if(room.slug==="caso-m")fg=page.mainFrame();
  const buttons=await fg.getByRole("button").allTextContents().catch(()=>[]);
  console.log("BUTTONS",viewport.name,room.slug,JSON.stringify(buttons.slice(0,25)));
  if(room.slug!=="caso-m"){
   const target=room.slug==="ultima-funcion"?fg.getByRole("button",{name:/ABRIR LAS PUERTAS/}):fg.getByRole("button",{name:/Aceptar el misterio/});
   try{if(await target.count())await target.first().click({timeout:8000});await page.waitForTimeout(1200);
    console.log("START",viewport.name,room.slug,JSON.stringify({source:fg.url(),newButtons:(await fg.getByRole("button").allTextContents()).slice(0,15),errors:problems.slice(-10)}));
   }catch(e){console.log("START_ERR",viewport.name,room.slug,String(e).slice(0,380));}
  }else{
   const target=fg.getByRole("button",{name:/INICIAR RESCATE/});
   try{if(await target.count())await target.first().click({timeout:8000});await page.waitForTimeout(1200);
    console.log("START",viewport.name,room.slug,JSON.stringify({url:page.url(),canvas:await page.locator("canvas").count(),errors:problems.slice(-10)}));
   }catch(e){console.log("START_ERR",viewport.name,room.slug,String(e).slice(0,450));}
  }
  await page.close();
 }
 await context.close();
}
await browser.close();
