"use client";

export const AFFILIATE_SESSION_KEY="thi_affiliate_session";
const SUPABASE_URL="https://efvvadfxuyieswdqnsjg.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";
const API=`${SUPABASE_URL}/functions/v1/affiliate-api`;

export async function affiliateCall<T>(
  action:string,
  payload:Record<string,unknown>={},
  withSession=true,
):Promise<T>{
  const session=typeof window!=="undefined"?window.localStorage.getItem(AFFILIATE_SESSION_KEY)||"":"";
  const response=await fetch(API,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      apikey:PUBLISHABLE_KEY,
      ...(withSession&&session?{"x-affiliate-session":session}:{}),
    },
    body:JSON.stringify({action,...payload}),
    cache:"no-store",
  });
  const data=await response.json().catch(()=>({}));
  if(response.status===401&&withSession&&typeof window!=="undefined"){
    window.localStorage.removeItem(AFFILIATE_SESSION_KEY);
    window.dispatchEvent(new Event("thi-affiliate-session-expired"));
  }
  if(!response.ok)throw new Error(String(data?.error||"affiliate_request_failed"));
  return data as T;
}
