import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base="https://tehiceesto.com";
const outDir=path.resolve("tehiceesto-production-visual");
await fs.mkdir(outDir,{recursive:true});

const demos=["pareja","cumpleanos","hijos","abuelos","aniversario","propuesta","mama","papa","amistad"];
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
        await page.waitForTimeout(500);
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
  await inspect(page,"/crear",viewport.name,{fullPage:true});

  for(const slug of demos){
    await inspect(page,`/experiencias/${slug}`,viewport.name,{
      advanceDemo:true,
      fullPage:false,
    });
  }

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
