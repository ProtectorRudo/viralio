import {NextRequest,NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {processCierrePdfJobs} from "@/lib/cierre/pdf-jobs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function POST(req:NextRequest){
 const secret=process.env.CIERRE_JOB_SECRET||"";
 const bearer=req.headers.get("authorization")||"";
 const a=Buffer.from(bearer),b=Buffer.from("Bearer "+secret);
 if(secret.length<24||a.length!==b.length||!timingSafeEqual(a,b))
  return NextResponse.json({error:"unauthorized"},{status:401});
 try{return NextResponse.json(await processCierrePdfJobs(3),{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({error:"processing_unavailable"},{status:503});}
}
