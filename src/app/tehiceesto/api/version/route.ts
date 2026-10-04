import { NextResponse } from "next/server";

export const dynamic="force-dynamic";

export function GET(){
  return NextResponse.json({
    service:"tehiceesto",
    commit:process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||"local",
    branch:process.env.VERCEL_GIT_COMMIT_REF||process.env.GITHUB_REF_NAME||"local",
    environment:process.env.VERCEL_ENV||process.env.NODE_ENV||"development",
  },{
    headers:{"Cache-Control":"no-store, max-age=0"},
  });
}
