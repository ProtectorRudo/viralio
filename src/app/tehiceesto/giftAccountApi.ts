"use client";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./creatorApi";

export const GIFT_ACCOUNT_API=`${SUPABASE_URL}/functions/v1/gift-account`;
export const ACCOUNT_TOKEN_KEY="thi_account_access";

export async function giftAccountCall<T=Record<string,unknown>>(
  action:string,
  body:Record<string,unknown>={},
  accessToken="",
){
  const response=await fetch(GIFT_ACCOUNT_API,{
    method:"POST",
    headers:{
      apikey:SUPABASE_PUBLISHABLE_KEY,
      "content-type":"application/json",
      ...(accessToken?{authorization:`Bearer ${accessToken}`}:{}),
    },
    body:JSON.stringify({action,...body}),
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(String(data?.error||"account_failed"));
  return data as T;
}

export async function requestGiftAccountLink(email:string,code=""){
  return giftAccountCall<{ok:boolean}>("requestLink",{email,code});
}
