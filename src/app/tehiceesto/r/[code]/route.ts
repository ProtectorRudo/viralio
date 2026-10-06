import { NextRequest, NextResponse } from "next/server";

const API="https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/affiliate-public";
const KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";

function referrerHost(request:NextRequest){
  const raw=request.headers.get("referer");
  if(!raw)return "";
  try{return new URL(raw).hostname.slice(0,160);}catch{return "";}
}

export async function GET(
  request:NextRequest,
  context:{params:Promise<{code:string}>},
){
  const {code}=await context.params;
  const cleanCode=String(code||"").trim().toLowerCase();
  const visitorId=request.cookies.get("thi_affiliate_visitor")?.value||crypto.randomUUID();
  const source=(request.nextUrl.searchParams.get("src")||"").trim().toLowerCase().slice(0,60);
  const host=(request.headers.get("host")||"").split(":")[0].toLowerCase();
  const dedicated=host==="tehiceesto.com"||host==="www.tehiceesto.com";
  const fallback=dedicated?new URL("/",request.url):new URL("/tehiceesto",request.url);

  if(!/^[a-z0-9][a-z0-9-]{2,49}$/.test(cleanCode)){
    return NextResponse.redirect(fallback,302);
  }

  try{
    const response=await fetch(API,{
      method:"POST",
      headers:{"content-type":"application/json",apikey:KEY},
      body:JSON.stringify({
        action:"track",
        code:cleanCode,
        visitorId,
        source,
        landingPath:"/",
        referrerDomain:referrerHost(request),
      }),
      cache:"no-store",
    });
    const data=await response.json().catch(()=>({})) as {
      affiliateToken?:string;
      expiresAt?:string;
    };

    const target=dedicated?new URL("/",request.url):new URL("/tehiceesto",request.url);
    const redirect=NextResponse.redirect(target,302);
    redirect.headers.set("Cache-Control","private, no-store");
    redirect.headers.set("Referrer-Policy","no-referrer");

    if(response.ok&&data.affiliateToken){
      const maxAge=Math.max(
        60,
        Math.floor((new Date(data.expiresAt||Date.now()+30*86400000).getTime()-Date.now())/1000),
      );
      const options={
        path:"/",
        maxAge,
        sameSite:"lax" as const,
        secure:process.env.NODE_ENV==="production",
      };
      redirect.cookies.set("thi_affiliate_token",data.affiliateToken,options);
      redirect.cookies.set("thi_affiliate_visitor",visitorId,options);
      redirect.cookies.set("thi_affiliate_code",cleanCode,options);
      if(source)redirect.cookies.set("thi_affiliate_source",source,options);
    }
    return redirect;
  }catch{
    return NextResponse.redirect(fallback,302);
  }
}
