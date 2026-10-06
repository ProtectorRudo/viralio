"use client";

import { useEffect } from "react";
import { affiliatePublicCall } from "../../affiliateApi";

function readCookie(name:string){
  const prefix=`${name}=`;
  const item=document.cookie.split("; ").find(part=>part.startsWith(prefix));
  return item?decodeURIComponent(item.slice(prefix.length)):"";
}

export default function AffiliateRedirect({code,source}:{code:string;source:string}){
  useEffect(()=>{
    let cancelled=false;
    void (async()=>{
      const visitorId=readCookie("thi_affiliate_visitor")||crypto.randomUUID();
      try{
        const data=await affiliatePublicCall<{affiliateToken:string;expiresAt:string}>("track",{
          code,visitorId,source,landingPath:"/",referrerDomain:document.referrer?new URL(document.referrer).hostname:"",
        });
        if(cancelled)return;
        const expires=Math.max(60,Math.floor((new Date(data.expiresAt).getTime()-Date.now())/1000));
        const secure=window.location.protocol==="https:"?"; Secure":"";
        document.cookie=`thi_affiliate_token=${encodeURIComponent(data.affiliateToken)}; Max-Age=${expires}; Path=/; SameSite=Lax${secure}`;
        document.cookie=`thi_affiliate_visitor=${visitorId}; Max-Age=${expires}; Path=/; SameSite=Lax${secure}`;
        document.cookie=`thi_affiliate_code=${encodeURIComponent(code)}; Max-Age=${expires}; Path=/; SameSite=Lax${secure}`;
        if(source)document.cookie=`thi_affiliate_source=${encodeURIComponent(source)}; Max-Age=${expires}; Path=/; SameSite=Lax${secure}`;
      }catch{}
      if(cancelled)return;
      const dedicated=window.location.hostname==="tehiceesto.com"||window.location.hostname==="www.tehiceesto.com";
      window.location.replace(dedicated?"/":"/tehiceesto");
    })();
    return()=>{cancelled=true};
  },[code,source]);

  return(
    <main className="thi-aff-redirect">
      <div className="thi-aff-redirect-mark">TE HICE ESTO</div>
      <p>Abriendo tu experiencia…</p>
    </main>
  );
}
