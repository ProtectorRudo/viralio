"use client";

import { SESSION_KEY } from "./admin/api";

export const AFFILIATE_SUPABASE_URL="https://efvvadfxuyieswdqnsjg.supabase.co";
export const AFFILIATE_PUBLISHABLE_KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";
export const AFFILIATE_PUBLIC_API=`${AFFILIATE_SUPABASE_URL}/functions/v1/affiliate-public`;
export const AFFILIATE_ADMIN_API=`${AFFILIATE_SUPABASE_URL}/functions/v1/affiliate-admin`;
export const AFFILIATE_SESSION_KEY="thi_affiliate_session";

export async function affiliateAdminCall<T=Record<string,unknown>>(
  action:string,
  payload:Record<string,unknown>={},
):Promise<T>{
  const session=typeof window!=="undefined"?window.sessionStorage.getItem(SESSION_KEY)||"":"";
  const response=await fetch(AFFILIATE_ADMIN_API,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      apikey:AFFILIATE_PUBLISHABLE_KEY,
      ...(session?{"x-admin-session":session}:{}),
    },
    body:JSON.stringify({action,...payload}),
    cache:"no-store",
  });
  const data=await response.json().catch(()=>({}));
  if(response.status===401){
    window.sessionStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event("thi-admin-session-expired"));
  }
  if(!response.ok)throw new Error(String(data?.error||"affiliate_admin_failed"));
  return data as T;
}

export async function affiliatePublicCall<T=Record<string,unknown>>(
  action:string,
  payload:Record<string,unknown>={},
  session?:string,
):Promise<T>{
  const response=await fetch(AFFILIATE_PUBLIC_API,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      apikey:AFFILIATE_PUBLISHABLE_KEY,
      ...(session?{"x-affiliate-session":session}:{}),
    },
    body:JSON.stringify({action,...payload}),
    cache:"no-store",
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(String(data?.error||"affiliate_request_failed"));
  return data as T;
}
