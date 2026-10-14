/* Launch gate for the live Te Hice Esto storefront.
 * Simulates (never performs) checkout. All actual purchases remain untouched.
 */
import fs from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";
const base="https://tehiceesto.com";
const live=["pareja","mama","cumpleanos","papa","hijos","amistad"];
const paused=["abuelos","aniversario","propuesta"];
const escapes=["caso-m","ultima-funcion","ultima-campanada"];
const descriptions={ "caso-m":"CASO M", "ultima-funcion":"La Última Función", "ultima-campanada":"La Última Campanada" };
const failures=[],checks=[];
const dir=path.resolve("tehiceesto-launch-readiness");
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
async function check(label,fn){
 try{await fn();checks.push({label,pass:true});console.log("PASS",label)}
 catch(e){const message=String(e);failures.push({label,message});checks.push({label,pass:false,message});console.error("FAIL",label,message.slice(0,900))}
}
async function clickPopup(context,page,selector,expected){
 const popupPromise=context.waitForEvent("page",{timeout:12000});
 await page.locator(selector).click({timeout:15000});
 const popup=await popupPromise;
 await popup.waitForLoadState("domcontentloaded",{timeout:25000});
 const actual=new URL(popup.url());
 if(actual.origin!==base||actual.pathname!==expected)throw Error("Demo popup "+actual.pathname+" expected "+expected);
 if(await popup.locator("main.thi-experience").count()!==1)throw Error("Experience canvas missing for "+expected);
 await popup.close();
}
for(const view of [{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}]){
 const context=await browser.newContext({viewport:{width:view.width,height:view.height},locale:"es-AR",isMobile:view.name==="mobile",hasTouch:view.name==="mobile"});
 const page=await context.newPage();const jsErrors=[];
 page.on("pageerror",e=>jsErrors.push(e.message));
 await check(view.name+" Home navigation & 3 featured rooms",async()=>{
   const r=await page.goto(base+"/",{waitUntil:"domcontentloaded",timeout:60000});
   if(r?.status()!==200)throw Error("Home HTTP "+r?.status());
   const links=await page.locator("#escapes .thh-escape-demo").count();
   const buys=await page.locator("#escapes .thh-escape-buy").count();
   if(links!==3||buys!==3)throw Error("Home escapes missing: "+links+" / "+buys);
   if(await page.locator('a[href="/arrepentimiento"]').count()<1)
     throw Error("Consumer withdrawal link missing from home");
   for(const slug of escapes){
    if(await page.locator(`#escapes a.thh-escape-demo[href="/escapes/${slug}"]`).count()!==1
      ||await page.locator(`#escapes a.thh-escape-buy[href="/escapes/${slug}/comprar"]`).count()!==1)
      throw Error("Home incorrect route "+slug);
   }
   if(await page.locator('a.thh-v2-recipient').count()!==6)throw Error("Occasion selector incomplete");
   for(const slug of live){
     if(await page.locator(`a.thh-v2-recipient[href="/experiencias/${slug}"]`).count()!==1)throw Error("Home recipient "+slug);
   }
 });
 await check(view.name+" /crear catalog includes all 12 cards",async()=>{
   const r=await page.goto(base+"/crear",{waitUntil:"domcontentloaded",timeout:60000});
   if(r?.status()!==200)throw Error("/crear HTTP "+r?.status());
   for(const slug of [...live,...paused]){
     const card=page.locator(`.thi-simple-card-${slug}`);
     if(await card.count()!==1)throw Error("Missing gift card "+slug);
     if(paused.includes(slug)){
       if(await card.locator("button.thi-simple-choose").count()||await card.locator("a.thi-simple-preview").count())
        throw Error("Coming soon card is purchasable "+slug);
       if(!(await card.textContent()).includes("Próximamente"))throw Error("No paused label "+slug);
     }else{
       const dest=await card.locator("a.thi-simple-preview").getAttribute("href");
       if(dest!=="/experiencias/"+slug)throw Error("Non-canonical demo link "+slug+": "+dest);
     }
   }
   if(await page.locator(".thi-simple-escape-card").count()!==3)throw Error("Missing escape cards");
   if(await page.locator('a[href="/arrepentimiento"]').count()<1)
     throw Error("Consumer rights shortcut missing from gift catalog");
 });
 for(const slug of live){
   await check(view.name+" playable gift card "+slug,async()=>{
     if(page.url()!==base+"/crear")await page.goto(base+"/crear",{waitUntil:"domcontentloaded"});
     const selector=`.thi-simple-card-${slug}`;
     await clickPopup(context,page,selector+" a.thi-simple-preview","/experiencias/"+slug);
     await page.locator(selector+" button.thi-simple-choose").click();
     const copy=await page.locator(".order-selected-template").textContent()||"";
     if(!copy.trim()||!copy.includes("ELEGISTE"))throw Error("Order selection failed");
     if(await page.locator('form.order-contact-form input[type="email"]').count()!==1)throw Error("Contact form missing");
     await page.locator("button.order-back").click();
   });
 }
 for(const slug of escapes){
   await check(view.name+" escape catalog card and selection "+slug,async()=>{
     if(page.url()!==base+"/crear")await page.goto(base+"/crear",{waitUntil:"domcontentloaded"});
     const card=page.locator(".thi-simple-escape-card").filter({hasText:descriptions[slug]});
     if(await card.count()!==1)throw Error("Escape card missing");
     const link=await card.locator("a.thi-simple-preview").getAttribute("href");
     if(link!=="/escapes/"+slug)throw Error("Escape preview mismatch "+link);
     await card.locator("button.thi-simple-choose").click();
     const copy=await page.locator(".order-selected-template").textContent()||"";
     if(!copy.includes(descriptions[slug]))throw Error("Incorrect selected room: "+copy.slice(0,120));
     if(!(await page.locator(".order-step-head").textContent()).includes("nuestro equipo se contacta"))throw Error("Assisted delivery not disclosed");
     await page.locator("button.order-back").click();
   });
 }
 await check(view.name+" all 3 demo landing pages and full-screen launch",async()=>{
   for(const slug of escapes){
    const r=await page.goto(base+"/escapes/"+slug,{waitUntil:"domcontentloaded",timeout:45000});
    if(r?.status()!==200)throw Error("Demo landing "+slug+": "+r?.status());
    const a=page.getByRole("link",{name:"Iniciar partida de "+(slug==="caso-m"?"CASO M · Operación Rescate":descriptions[slug])});
    const href=await a.getAttribute("href");
    if(!href?.startsWith("https://"))throw Error("No launch game "+slug);
    const purchase=await page.locator('a[href="/escapes/'+slug+'/comprar"]').count();
    if(purchase<1)throw Error("No purchase button on room demo "+slug);
   }
 });
 const purchaseAudit=async(slug,mode)=>{
   const submitted=[];
   await page.route("**/functions/v1/order-create",async route=>{
     const payload=route.request().postDataJSON();
     submitted.push(payload);
     await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({code:"abcdef123456789abc",checkoutUrl:null,checkoutReady:false,priceMinor:2500000,currency:"ARS"})});
   });
   try{
    if(mode==="single"){
      await page.goto(base+"/escapes/"+slug+"/comprar",{waitUntil:"domcontentloaded"});
      await page.waitForTimeout(1100); // ensure interactive checkout handlers are hydrated
      await page.locator('input[autocomplete="name"]').fill("Auditoría Te Hice Esto");
      await page.locator('input[autocomplete="tel"]').fill("5492215653163");
      await page.locator('input[type="email"]').fill("auditoria@example.com");
      await page.locator('input[type="checkbox"]').check();
      await page.getByRole("button",{name:/Comprar con Mercado Pago/}).click();
    }else{
      await page.goto(base+"/crear?experiencia=escape-"+slug,{waitUntil:"domcontentloaded"});
      await page.waitForTimeout(1100);
      await page.locator('input[autocomplete="name"]').fill("Auditoría Te Hice Esto");
      await page.locator('input[autocomplete="tel"]').fill("5492215653163");
      await page.locator('input[type="email"]').fill("auditoria@example.com");
      await page.locator('input[type="checkbox"]').check();
      await page.locator('button[type="submit"]').click();
    }
    await page.waitForTimeout(400);
    if(submitted.length!==1)throw Error("Expected one simulated order API call, got "+submitted.length);
    const payload=submitted[0];
    if(payload.experienceSlug!=="escape-"+slug||!payload.consent||!payload.clientRequestId||payload.whatsapp!=="5492215653163")
      throw Error("Checkout payload mismatch: "+JSON.stringify(payload));
    if(!String(payload.email).includes("@"))throw Error("No purchaser email");
    if(await page.locator('a[href$="/pedido/abcdef123456789abc"]').count()!==1)
      throw Error("Order tracking link missing for unpaid checkout");
   }finally{await page.unroute("**/functions/v1/order-create")}
 };
 for(const slug of escapes){
   await check(view.name+" no-charge simulated purchase "+slug,()=>purchaseAudit(slug,"single"));
   await check(view.name+" no-charge /crear purchase "+slug,()=>purchaseAudit(slug,"wizard"));
 }
 for(const slug of live){
   await check(view.name+" no-charge traditional gift purchase "+slug,async()=>{
     const submitted=[];
     await page.route("**/functions/v1/order-create",async route=>{
       submitted.push(route.request().postDataJSON());
       await route.fulfill({status:200,contentType:"application/json",
         body:JSON.stringify({code:"abcdef123456789abc",checkoutUrl:null,checkoutReady:false,priceMinor:2500000,currency:"ARS"})});
     });
     try{
       await page.goto(base+"/crear?experiencia="+slug,{waitUntil:"domcontentloaded",timeout:45000});
       await page.waitForTimeout(1100); // wait for React hydration, not only server-rendered HTML
       const name=await page.locator(".order-selected-template").innerText();
       if(!name.includes("ELEGISTE"))throw Error("Gift deep link did not select "+slug);
       await page.locator('input[autocomplete="name"]').fill("Auditoría Te Hice Esto");
       await page.locator('input[autocomplete="tel"]').fill("5492215653163");
       await page.locator('input[type="email"]').fill("auditoria@example.com");
       await page.locator('input[type="checkbox"]').check();
       await page.locator('button[type="submit"]').click();
       await page.waitForTimeout(350);
       if(submitted.length!==1)throw Error("Expected one order submission, got "+submitted.length);
       const payload=submitted[0];
       if(payload.experienceSlug!==slug||!payload.consent||!payload.clientRequestId
           ||payload.whatsapp!=="5492215653163")throw Error("Invalid order for "+slug+": "+JSON.stringify(payload));
       if(await page.locator('a[href$="/pedido/abcdef123456789abc"]').count()!==1)
         throw Error("Missing private order tracking after checkout failover: "+slug);
     }finally{await page.unroute("**/functions/v1/order-create")}
   });
 }
 await check(view.name+" consumer withdrawal form and immediate receipt",async()=>{
   const response=await page.goto(base+"/arrepentimiento",{waitUntil:"domcontentloaded",timeout:45000});
   await page.waitForTimeout(1100); // ensure client event handlers are interactive
   if(response?.status()!==200)throw Error("Public withdrawal page HTTP "+response?.status());
   const pageBody=await page.locator("body").innerText();
   const heading=(await page.locator(".thi-legal-intro h1").innerText()).replace(/\\s+/g," ").trim();
   if(!heading.includes("Botón de arrepentimiento")||!pageBody.includes("No necesitás registrarte"))
     throw Error("Consumer rights information missing; heading="+heading);
   const submitted=[];
   await page.route("**/functions/v1/commerce-withdrawals",async route=>{
      submitted.push(route.request().postDataJSON());
      await route.fulfill({status:201,contentType:"application/json",
        body:JSON.stringify({ok:true,ticketCode:"THI-AUDITORIA12",receivedAt:new Date().toISOString()})});
   });
   try{
     await page.locator('input[autocomplete="name"]').fill("Auditoría Te Hice Esto");
     await page.locator('input[type="email"]').fill("auditoria@example.com");
     await page.getByRole("button",{name:/Registrar solicitud de arrepentimiento/}).click();
     await page.getByText("THI-AUDITORIA12").waitFor({timeout:7500});
     if(submitted.length!==1||submitted[0].action!=="submit"||submitted[0].email!=="auditoria@example.com")
       throw Error("Withdrawal receipt flow did not submit properly");
   }finally{await page.unroute("**/functions/v1/commerce-withdrawals")}
 });
  await check(view.name+" privacy notice and public consumer contact",async()=>{
   const r=await page.goto(base+"/privacidad",{waitUntil:"domcontentloaded",timeout:45000});
   if(r?.status()!==200)throw Error("Privacy page HTTP "+r?.status());
   const text=await page.locator("main").innerText();
   for(const phrase of ["Qué información utilizamos","Para qué se usa","Mercado Pago","Consultas, correcciones y eliminación"]){
     if(!text.includes(phrase))throw Error("Missing privacy explanation: "+phrase);
   }
   if(await page.locator('a[href="/arrepentimiento"]').count()<1)throw Error("No withdrawal route from privacy notice");
 });
 await check(view.name+" admin consumer tickets require login",async()=>{
   const r=await page.goto(base+"/admin/arrepentimientos",{waitUntil:"domcontentloaded",timeout:45000});
   if(r?.status()!==200)throw Error("Admin ticket page HTTP "+r?.status());
   const text=await page.locator("main").innerText();
   await page.getByText("Ingresá primero al").waitFor({state:"visible",timeout:12000});
   if(!text.includes("Ingresá primero al")&&await page.locator("main").innerText().then(s=>!s.includes("Ingresá primero al")))throw Error("Consumer ticket list not protected in browser without login");
 });
  await check(view.name+" checkout price and transparent delivery copy",async()=>{
   const r=await page.goto(base+"/escapes/caso-m/comprar",{waitUntil:"domcontentloaded"});
   if(r?.status()!==200)throw Error("Not purchasable");
   const body=await page.locator("body").innerText();
   if(!body.includes("25.000")||!body.includes("Nuestro equipo")||!body.includes("Mercado Pago"))throw Error("Price, assisted process or payment missing");
   const c=await page.locator('main[class*="checkout"]').boundingBox();
   if(!c||c.width>view.width+10)throw Error("Purchase overflow");
 });
 await check(view.name+" unknown gift/escape cannot be purchased",async()=>{
   for(const route of ["/escapes/no-existe","/escapes/no-existe/comprar"]){
     const response=await page.goto(base+route,{waitUntil:"domcontentloaded"});
     const body=await page.locator("body").innerText();
     if(response?.status()!==404&&!body.includes("Este lugar no existe")&&!body.includes("Acá no hay una historia"))
       throw Error("No 404 branding: "+route);
   }
 });
 await check(view.name+" privacy: guessed code has no visible invitation",async()=>{
   const response=await page.goto(base+"/escape-r/000000000000000000",{waitUntil:"domcontentloaded"});
   const body=await page.locator("body").innerText();
   if(body.includes("INICIAR DEMO Y JUGAR")||body.includes("ABRIR MI EXPERIENCIA"))
     throw Error("Guessed gift URL exposed player");
   const tag=response?.headers()["x-robots-tag"]||"";
   if(!tag.includes("noindex"))throw Error("Private path missing robots protection");
 });
 if(jsErrors.length)failures.push({label:view.name+" uncaught browser exceptions",message:jsErrors.slice(0,8).join(" | ")});
 await context.close();
}
await check("commercial: withdrawal API exists and rejects anonymous missing key",async()=>{
  const response=await fetch("https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/commerce-withdrawals",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"submit",name:"Test",email:"no@example.com"})});
  if(response.status!==401)throw Error("Unexpected authorization response "+response.status);
});
await check("commercial: Mercado Pago public configuration health",async()=>{
 const req=await fetch("https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2?status=1");
 if(!req.ok)throw Error("Checkout health HTTP "+req.status);
 const data=await req.json();
 if(data.configured!==true)throw Error("Mercado Pago not configured: "+JSON.stringify(data));
});
await browser.close();
await fs.writeFile(path.join(dir,"report.json"),JSON.stringify({createdAt:new Date().toISOString(),checks,failures},null,2));
console.log("READINESS_REPORT",JSON.stringify({total:checks.length,passed:checks.filter(x=>x.pass).length,failed:failures.length,failures:failures.slice(0,25)}));
if(failures.length)process.exitCode=1;
