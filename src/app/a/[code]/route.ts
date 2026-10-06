import { NextRequest } from "next/server";
import { handleAffiliateRedirect } from "@/lib/tehiceesto-affiliate-route";

export async function GET(request:NextRequest,{params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  return handleAffiliateRedirect(request,code.toLowerCase());
}
