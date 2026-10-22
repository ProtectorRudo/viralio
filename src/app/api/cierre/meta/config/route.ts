import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const app_id=process.env.CIERRE_META_APP_ID||"";
 const config_id=process.env.CIERRE_META_CONFIG_ID||"";
 const ready=Boolean(app_id&&config_id&&process.env.CIERRE_META_APP_SECRET&&process.env.CIERRE_TOKEN_ENCRYPTION_KEY&&process.env.CIERRE_META_VERIFY_TOKEN);
 return NextResponse.json({ready,app_id:ready?app_id:null,config_id:ready?config_id:null,version:"v4",mode:"shadow"},{
  headers:{"Cache-Control":"no-store"}
 });
}
