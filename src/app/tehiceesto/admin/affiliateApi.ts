"use client";

import { SESSION_KEY } from "./api";

const SUPABASE_URL="https://efvvadfxuyieswdqnsjg.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";
const API=`${SUPABASE_URL}/functions/v1/affiliate-admin-api`;

export async function affiliateAdminCall<T>(
  action:string,
  payload:Record<string,unknown>={},
):Promise<T>{
  const session=typeof window!=="undefined"?window.sessionStorage.getItem(SESSION_KEY)||"":"";
  const response=await fetch(API,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      apikey:PUBLISHABLE_KEY,
      ...(session?{"x-admin-session":session}:{}),
    },
    body:JSON.stringify({action,...payload}),
    cache:"no-store",
  });
  const data=await response.json().catch(()=>({}));
  if(response.status===401&&typeof window!=="undefined"){
    window.sessionStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event("thi-admin-session-expired"));
  }
  if(!response.ok)throw new Error(String(data?.error||"affiliate_admin_request_failed"));
  return data as T;
}
