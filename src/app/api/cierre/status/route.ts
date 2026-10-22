import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 return NextResponse.json({
  mode:"shadow",can_send:false,
  ai_configured:Boolean(process.env.CIERRE_OPENAI_API_KEY),
  meta_webhook_configured:Boolean(process.env.CIERRE_META_APP_SECRET&&process.env.CIERRE_META_VERIFY_TOKEN&&process.env.CIERRE_CONTACT_HASH_KEY),
  media_access_configured:Boolean(process.env.CIERRE_TOKEN_ENCRYPTION_KEY),
  queue_runner_configured:Boolean(process.env.CIERRE_JOB_SECRET),
  version:"0.6.0"
 },{headers:{"Cache-Control":"no-store"}});
}
