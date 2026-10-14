import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base="https://tehiceesto.com";
const outDir=path.resolve("tehiceesto-production-visual");
await fs.mkdir(outDir,{recursive:true});

// Auditable full journeys only: these three models are intentionally paused.
const demos=["pareja","cumpleanos","hijos","mama","papa","amistad"];
const viewports=[
  {name:"desktop",width:1440,height:1000},
  {name:"mobile",width:390,height:844},
];

const report={generatedAt:new Date().toISOString(),base,pages:[]};
const browser=await chromium.launch({headless:true});

function fileSafe(route){
  return route==="/"
    ?"home"
    :route.replace(/^\//,"").replaceAll("/","-");
}

async function inspect(page,route,mode,{advanceDemo=false,fullPage=true}={}){
  const pageErrors=[];
  const consoleErrors=[];
  const onPageError=(error)=>pageErrors.push(String(error));
  const onConsole=(message)=>{if(message.type()==="error")consoleErrors.push(message.text())};
  page.on("pageerror",onPageError);
  page.on("console",onConsole);

  const response=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForTimeout(1100);

  let scene=null;
  if(route.startsWith("/experiencias/")){
    scene=await page.locator("main.thi-experience").getAttribute("data-scene");
    if(advanceDemo&&scene==="intro"){
      const advance=page.locator('[data-action="advance"]').first();
      if(await advance.count()&&await advance.isVisible()){
        await advance.click();
        await page.waitForTimeout(route==="/experiencias/amistad"?1700:500);
        scene=await page.locator("main.thi-experience").getAttribute("data-scene");
      }
    }
  }

  const metrics=await page.evaluate(()=>{
    const root=document.documentElement;
    const selectorRects=(selectors)=>selectors.map(selector=>{
      const element=document.querySelector(selector);
      if(!element)return null;
      const style=getComputedStyle(element);
      const rect=element.getBoundingClientRect();
      if(style.display==="none"||style.visibility==="hidden"||rect.width<1||rect.height<1)return null;
      return {selector,left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height,position:style.position};
    }).filter(Boolean);

    const chrome=selectorRects([
      ".floating-whatsapp",
      ".soundtrack-control",
      ".thi-progress",
      ".thi-scene-meta",
      ".thi-reset-journey",
    ]);

    const collisions=[];
    for(let i=0;i<chrome.length;i++){
      for(let j=i+1;j<chrome.length;j++){
        const a=chrome[i],b=chrome[j];
        const horizontal=Math.min(a.right,b.right)-Math.max(a.left,b.left);
        const vertical=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
        if(horizontal>4&&vertical>4){
          collisions.push([a.selector,b.selector]);
        }
      }
    }

    const offenders=[...document.querySelectorAll("body *")].map(element=>{
      const rect=element.getBoundingClientRect();
      return {
        tag:element.tagName.toLowerCase(),
        cls:typeof element.className==="string"?element.className.slice(0,120):"",
        left:Math.round(rect.left),
        right:Math.round(rect.right),
        width:Math.round(rect.width),
      };
    }).filter(item=>item.width>0&&(item.left<-4||item.right>window.innerWidth+4)).slice(0,20);

    const cta=document.querySelector(".floating-whatsapp");
    const ctaStyle=cta?(()=>{
      const style=getComputedStyle(cta);
      const chain=[];
      let node=cta.parentElement;
      while(node&&chain.length<5){
        const parentStyle=getComputedStyle(node);
        chain.push({
          tag:node.tagName.toLowerCase(),
          cls:typeof node.className==="string"?node.className.slice(0,100):"",
          opacity:parentStyle.opacity,
          filter:parentStyle.filter,
          transform:parentStyle.transform,
          isolation:parentStyle.isolation,
          zIndex:parentStyle.zIndex,
        });
        node=node.parentElement;
      }
      return {
        className:cta.className,
        opacity:style.opacity,
        backgroundColor:style.backgroundColor,
        color:style.color,
        borderColor:style.borderColor,
        boxShadow:style.boxShadow,
        zIndex:style.zIndex,
        display:style.display,
        visibility:style.visibility,
        filter:style.filter,
        transform:style.transform,
        mixBlendMode:style.mixBlendMode,
        chain,
      };
    })():null;

    return {
      innerWidth:window.innerWidth,
      scrollWidth:root.scrollWidth,
      overflow:root.scrollWidth-window.innerWidth,
      bodyHeight:document.body.scrollHeight,
      title:document.title,
      chrome,
      collisions,
      offenders,
      ctaStyle,
    };
  });

  const suffix=advanceDemo&&route.startsWith("/experiencias/")?`-${scene||"unknown"}`:"";
  const screenshot=path.join(outDir,`${fileSafe(route)}-${mode}${suffix}.png`);
  await page.screenshot({path:screenshot,fullPage});

  const entry={
    route,mode,status:response?.status()??null,scene,
    screenshot:path.basename(screenshot),
    metrics,pageErrors,consoleErrors,
  };
  report.pages.push(entry);

  page.off("pageerror",onPageError);
  page.off("console",onConsole);
  return entry;
}

for(const viewport of viewports){
  const context=await browser.newContext({
    viewport:{width:viewport.width,height:viewport.height},
    locale:"es-AR",
    reducedMotion:"no-preference",
  });
  const page=await context.newPage();

  await inspect(page,"/",viewport.name,{fullPage:true});
  const coverAudit=await page.evaluate(()=>{
    const collection=document.querySelector("#escapes");
    const cards=[...document.querySelectorAll("#escapes .thh-escape-card")];
    const sceneSizes=cards.map(card=>{
      const svg=card.querySelector("svg"),box=svg?.getBoundingClientRect();
      const demo=card.querySelector(".thh-escape-demo"),buy=card.querySelector(".thh-escape-buy");
      const d=demo?.getBoundingClientRect(),b=buy?.getBoundingClientRect();
      return {
        width:box?.width||0,height:box?.height||0,
        demoHeight:d?.height||0,buyHeight:b?.height||0,
        demoUrl:demo?.getAttribute("href")||"",buyUrl:buy?.getAttribute("href")||"",
      };
    });
    const bg=collection?getComputedStyle(collection).backgroundImage:"";
    return {count:cards.length,sceneSizes,bg,isHeader:Boolean(document.querySelector(".thh-v2-header"))};
  });
  if(coverAudit.count!==3||!coverAudit.bg.includes("linear-gradient")||!coverAudit.isHeader){
    throw new Error("Home escape collection missing its 3 cinematic scenes: "+JSON.stringify(coverAudit));
  }
  for(const [i,item] of coverAudit.sceneSizes.entries()){
    const slug=["caso-m","ultima-funcion","ultima-campanada"][i];
    if(item.width<170||item.height<105||item.demoHeight<44||item.buyHeight<44||
      !item.demoUrl.endsWith("/escapes/"+slug)||!item.buyUrl.endsWith("/escapes/"+slug+"/comprar")){
      throw new Error("Invalid gallery scene or touch CTA for "+slug+": "+JSON.stringify(item));
    }
  }
  console.log("PASS: premium home gallery with 3 cinematic scenes, separate demos/purchases, touch targets ("+viewport.name+")");
  await inspect(page,"/crear",viewport.name,{fullPage:true});
  // A regression previously hid the escape collection from the actual purchase route.
  // Verify the real selector, demo links, step-2 product and assisted-fulfillment copy.
  const escapeNames=["CASO M","La Última Función","La Última Campanada"];
  const escapeSlugs=["caso-m","ultima-funcion","ultima-campanada"];
  if(await page.locator(".thi-simple-escape-card").count()!==3)
    throw new Error("/crear must display all three escape products");
  if(await page.locator(".thi-simple-card-pareja").count()!==1)
    throw new Error("Existing gifts disappeared from /crear");
  for(const [i,slug] of escapeSlugs.entries()){
    const card=page.locator(".thi-simple-escape-card").nth(i);
    const demo=card.locator("a.thi-simple-preview");
    if((await demo.getAttribute("href"))!=="/escapes/"+slug)
      throw new Error("Incorrect escape demo on /crear: "+slug);
    const art=await card.locator("svg").boundingBox();
    const action=await card.locator(".thi-simple-choose").boundingBox();
    if(!art||!action||art.width<90||art.height<90||action.height<44)
      throw new Error("Escape artwork or main CTA inaccessible on "+viewport.name+": "+slug);
    await card.locator("button.thi-simple-choose").click();
    const selection=(await page.locator(".order-selected-template").textContent())||"";
    const explanation=(await page.locator(".order-step-head").textContent())||"";
    if(!selection.includes(escapeNames[i])||!explanation.includes("nuestro equipo se contacta"))
      throw new Error("Escape product selection or assisted text missing: "+slug);
    if(i===0)await page.screenshot({path:path.join(outDir,"crear-escape-checkout-"+viewport.name+".png"),fullPage:true});
    await page.locator("button.order-back").click();
  }
  // Direct links from campaigns and the storefront should preselect each room.
  const deepLink=await page.goto(base+"/crear?experiencia=escape-caso-m",{waitUntil:"domcontentloaded",timeout:45000});
  if(deepLink?.status()!==200 || !(await page.locator(".order-selected-template").textContent())?.includes("CASO M"))
    throw new Error("Escape deep link must open the correct product at step 2");
  // Ordinary gift flow must stay fully functional.
  await page.locator("button.order-back").click();
  await page.locator(".thi-simple-card-pareja button.thi-simple-choose").click();
  if(!(await page.locator(".order-selected-template").textContent())?.includes("Nuestra historia"))
    throw new Error("Original couple gift selection regressed");
  console.log("PASS: /crear displays 3 escape rooms, working demos, correct checkout product and old gifts ("+viewport.name+")");

  for(const slug of demos){
    await inspect(page,`/experiencias/${slug}`,viewport.name,{
      advanceDemo:true,
      fullPage:false,
    });
  }

  // Premium escape-room collection, complete mobile/desktop demo and purchase routes.
  for(const route of [
    "/escapes",
    "/escapes/caso-m",
    "/escapes/ultima-funcion",
    "/escapes/ultima-campanada",
    "/escapes/caso-m/comprar",
    "/escapes/ultima-funcion/comprar",
    "/escapes/ultima-campanada/comprar",
  ]){
    await inspect(page,route,viewport.name,{fullPage:!route.includes("/escapes/")});
  }

  // CASO M is intentionally full-screen; its actual 3D JS must be available
  // through the Te Hice Esto host rather than a stale Viralio redirect.
  const rescueJs=await page.request.get(base+"/escape-play/caso-m/app.js",{timeout:30000});
  if(rescueJs.status()!==200||(await rescueJs.body()).length<30000){
    throw new Error("CASO M standalone JavaScript is not reachable from Te Hice Esto");
  }
  const rescueModel=await page.request.get(base+"/escape-play/caso-m/models/stalker-skeletal.glb",{timeout:30000});
  if(rescueModel.status()!==200||(await rescueModel.body()).length<100000){
    throw new Error("CASO M animated character GLB is unavailable from the gift domain");
  }
  console.log("PASS: CASO M 3D engine and GLB are served under tehiceesto.com ("+viewport.name+")");
  // A guessed gift URL must never reveal a draft or a customer's surprise.
  const privateGuess=await page.request.get(base+"/escape-r/000000000000000000",{timeout:30000});
  const privateHtml=await privateGuess.text();
  const noIndex=String(privateGuess.headers()["x-robots-tag"]||"").includes("noindex");
  const brandedNotFound=privateHtml.includes("Este lugar no existe.")||privateHtml.includes("Acá no hay una historia");
  // Next.js streaming can return HTTP 200 even while correctly rendering notFound().
  // The guest must see the branded missing-page state with no game or message.
  if(privateGuess.status()!==404&&!(privateGuess.status()===200&&noIndex&&brandedNotFound)){
    throw new Error("Private escape visibility failure: HTTP "+privateGuess.status()+" noindex="+noIndex+" notFound="+brandedNotFound+"; htmlTail: "+privateHtml.slice(-260).replace(/<[^>]*>/g," "));
  }
  console.log("PASS: unpublished/unknown private gift stays hidden ("+viewport.name+")");
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outDir,"report.json"),JSON.stringify(report,null,2));

const failures=[];
for(const entry of report.pages){
  if(entry.status!==200) failures.push(`${entry.mode} ${entry.route}: HTTP ${entry.status}`);
  if(entry.metrics.overflow>4) failures.push(`${entry.mode} ${entry.route}: overflow ${entry.metrics.overflow}px`);
  if(entry.pageErrors.length) failures.push(`${entry.mode} ${entry.route}: ${entry.pageErrors.length} page errors`);
  if(entry.consoleErrors.length) failures.push(`${entry.mode} ${entry.route}: ${entry.consoleErrors.length} console errors`);
  if(entry.metrics.collisions.length) failures.push(`${entry.mode} ${entry.route}: collisions ${JSON.stringify(entry.metrics.collisions)}`);
  if(entry.route.startsWith("/experiencias/")&&(!entry.scene||entry.scene==="intro")) failures.push(`${entry.mode} ${entry.route}: demo did not advance from intro`);
}

console.log(JSON.stringify(report.pages.map(entry=>({
  route:entry.route,
  mode:entry.mode,
  status:entry.status,
  scene:entry.scene,
  overflow:entry.metrics.overflow,
  collisions:entry.metrics.collisions,
  pageErrors:entry.pageErrors.length,
  consoleErrors:entry.consoleErrors.length,
})),null,2));

if(failures.length){
  console.error("\nProduction visual audit failures:");
  failures.forEach(item=>console.error("- "+item));
  process.exit(1);
}
