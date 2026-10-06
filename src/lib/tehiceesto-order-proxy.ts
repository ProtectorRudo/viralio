import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL="https://efvvadfxuyieswdqnsjg.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";

function allowedOrigin(request:NextRequest){
  const origin=request.headers.get("origin");
  if(!origin)return true;
  try{
    const host=new URL(origin).hostname.toLowerCase();
    return host==="tehiceesto.com"||host==="www.tehiceesto.com"||host==="viralio.net"||host.endsWith(".vercel.app")||host==="localhost";
  }catch{return false}
}

export async function proxyTeHiceEstoOrder(request:NextRequest){
  if(!allowedOrigin(request))return NextResponse.json({error:"invalid_origin"},{status:403});

  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return NextResponse.json({error:"invalid_json"},{status:400})}

  const affiliateToken=request.cookies.get("thi_aff")?.value||"";
  const response=await fetch(`${SUPABASE_URL}/functions/v1/order-create`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      apikey:PUBLISHABLE_KEY,
    },
    body:JSON.stringify({...body,affiliateToken:affiliateToken||undefined}),
    cache:"no-store",
  });
  const data=await response.json().catch(()=>({error:"order_create_failed"}));
  return NextResponse.json(data,{
    status:response.status,
    headers:{"cache-control":"private, no-store, max-age=0"},
  });
}
