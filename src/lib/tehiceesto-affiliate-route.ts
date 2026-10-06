import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL="https://efvvadfxuyieswdqnsjg.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";

function dedicatedHost(host:string){
  const value=host.split(":")[0].toLowerCase();
  return value==="tehiceesto.com"||value==="www.tehiceesto.com";
}

export async function handleAffiliateRedirect(
  request:NextRequest,
  code:string,
){
  const host=request.headers.get("host")||"tehiceesto.com";
  const origin=new URL(request.url).origin;
  const dedicated=dedicatedHost(host);
  const destination=dedicated?"/":"/tehiceesto";
  const sharedCookie=dedicated?{domain:".tehiceesto.com"}:{};
  const fallback=NextResponse.redirect(new URL(destination,origin),302);

  if(!/^[a-z0-9][a-z0-9-]{2,49}$/.test(code)){
    return fallback;
  }

  const existingVisitor=request.cookies.get("thi_vid")?.value||"";
  const visitorId=/^[0-9a-f-]{36}$/i.test(existingVisitor)?existingVisitor:crypto.randomUUID();
  const source=(new URL(request.url).searchParams.get("src")||"")
    .toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,40);

  try{
    const response=await fetch(`${SUPABASE_URL}/functions/v1/affiliate-track`,{
      method:"POST",
      headers:{
        "content-type":"application/json",
        apikey:PUBLISHABLE_KEY,
      },
      body:JSON.stringify({
        action:"track",
        code,
        visitorId,
        source:source||null,
        landingPath:new URL(request.url).pathname,
        referrer:request.headers.get("referer")||"",
        userAgent:request.headers.get("user-agent")||"",
      }),
      cache:"no-store",
    });

    const data=await response.json().catch(()=>({})) as {
      tracked?:boolean;
      attributionToken?:string;
    };

    const result=NextResponse.redirect(new URL(destination,origin),302);
    result.cookies.set("thi_vid",visitorId,{
      httpOnly:true,
      sameSite:"lax",
      secure:process.env.NODE_ENV==="production",
      path:"/",
      maxAge:365*24*60*60,
      ...sharedCookie,
    });

    if(response.ok&&data.tracked&&data.attributionToken){
      result.cookies.set("thi_aff",data.attributionToken,{
        httpOnly:true,
        sameSite:"lax",
        secure:process.env.NODE_ENV==="production",
        path:"/",
        maxAge:30*24*60*60,
        ...sharedCookie,
      });
    }
    return result;
  }catch{
    fallback.cookies.set("thi_vid",visitorId,{
      httpOnly:true,
      sameSite:"lax",
      secure:process.env.NODE_ENV==="production",
      path:"/",
      maxAge:365*24*60*60,
      ...sharedCookie,
    });
    return fallback;
  }
}
