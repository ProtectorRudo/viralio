"use client";

import { useEffect, useState } from "react";
import { affiliatePublicCall } from "../../affiliateApi";

function readCookie(name:string){
  const prefix=`${name}=`;
  const item=document.cookie.split("; ").find(part=>part.startsWith(prefix));
  return item?decodeURIComponent(item.slice(prefix.length)):"";
}

export default function AffiliateRedirect({code,source}:{code:string;source:string}){
  const [retry,setRetry]=useState(0);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    let cancelled=false;
    const controller=new AbortController();
    const timer=window.setTimeout(()=>controller.abort(),10000);
    setFailed(false);
    void (async()=>{
      const visitorId=readCookie("thi_affiliate_visitor")||crypto.randomUUID();
      try{
        const data=await affiliatePublicCall<{affiliateToken:string;expiresAt:string;tracked?:boolean}>("track",{
          code,visitorId,source,landingPath:"/",referrerDomain:document.referrer?new URL(document.referrer).hostname:"",
        },undefined,controller.signal);
        if(cancelled)return;
        if(!data.affiliateToken||!data.expiresAt||"tracked" in data&&data.tracked===false)throw new Error("affiliate_attribution_missing");
        const expires=Math.max(60,Math.floor((new Date(data.expiresAt).getTime()-Date.now())/1000));
        if(!Number.isFinite(expires))throw new Error("affiliate_expiry_invalid");
        const secure=window.location.protocol==="https:"?"; Secure":"";
        document.cookie=`thi_affiliate_token=${encodeURIComponent(data.affiliateToken)}; Max-Age=${expires}; Path=/; SameSite=Lax${secure}`;
        document.cookie=`thi_affiliate_visitor=${visitorId}; Max-Age=${expires}; Path=/; SameSite=Lax${secure}`;
        document.cookie=`thi_affiliate_code=${encodeURIComponent(code)}; Max-Age=${expires}; Path=/; SameSite=Lax${secure}`;
        if(source)document.cookie=`thi_affiliate_source=${encodeURIComponent(source)}; Max-Age=${expires}; Path=/; SameSite=Lax${secure}`;
        // Never silently redirect when cookies are blocked: a later purchase
        // would be attributed to no influencer, even if the tracking API succeeded.
        if(readCookie("thi_affiliate_token")!==data.affiliateToken)throw new Error("affiliate_cookie_blocked");
        const dedicated=window.location.hostname==="tehiceesto.com"||window.location.hostname==="www.tehiceesto.com";
        window.location.replace(dedicated?"/":"/tehiceesto");
      }catch{
        // Paid influencer traffic cannot be sent into the store without an
        // attribution token. Offer a deliberate retry rather than losing sales.
        if(!cancelled)setFailed(true);
      }finally{
        window.clearTimeout(timer);
      }
    })();
    return()=>{cancelled=true;controller.abort();window.clearTimeout(timer)};
  },[code,source,retry]);

  return(
    <main className="thi-aff-redirect" aria-live="polite">
      <div className="thi-aff-redirect-mark">TE HICE ESTO</div>
      {failed?<>
        <p>La conexión se interrumpió antes de abrir tu experiencia.</p>
        <button type="button" onClick={()=>setRetry(value=>value+1)} className="thi-primary" data-action="retry-referral">Volver a intentar →</button>
      </>:<p>Abriendo tu experiencia…</p>}
    </main>
  );
}
