import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const root=process.cwd();
const file=(slug:string)=>readFileSync(join(root,"supabase","functions",slug,"index.ts"),"utf8");
describe("Te Hice Esto post-purchase onboarding wiring",()=>{
  it("verifies purchase and email ownership before issuing edit access",()=>{
    const src=file("gift-account");
    expect(src).toContain('.eq("buyer_email",email)');
    expect(src).toContain('.eq("status","approved")');
    expect(src).toContain('type:"magiclink"');
    expect(src).toContain('generateLink({');
    expect(src).toContain('https://tehiceesto.com/mis-regalos');
  });
  it("branded email is linked to the approved purchase, never in client code",()=>{
    const src=file("gift-account");
    expect(src).toContain("Gracias por elegir Te Hice Esto");
    expect(src).toContain("Empezar a crear mi regalo");
    expect(src).toContain('Deno.env.get("RESEND_API_KEY")');
    expect(src).toContain("https://api.resend.com/emails");
  });
  it("tracks successful delivery acceptance and retries failed delivery with cooldown",()=>{
    const src=file("payment-bridge");
    expect(src).toContain('next==="approved"');
    expect(src).toContain("access_email_last_attempt_at");
    expect(src).toContain("access_email_sent_at:new Date().toISOString()");
    expect(src).toContain("retryWindowMs=20*60*1000");
  });
  it("allows status reconciliation of approved orders without unlocking repeat checkout",()=>{
    const gateway=file("tehiceesto-checkout-v2");
    const bridge=file("payment-bridge");
    expect(gateway).toContain('syncStatusOnly:action==="sync-status"');
    expect(bridge).toContain('&&body.syncStatusOnly!==true');
    expect(gateway).toContain('if(action==="sync-status")');
  });
  it("automatically retries unsent approved purchase messages with safeguards",()=>{
    const sql=readFileSync(join(root,"supabase","migrations","20261008_tehiceesto_auto_retry_purchased_access_email.sql"),"utf8");
    expect(sql).toContain("status = 'approved'");
    expect(sql).toContain("access_email_sent_at is null");
    expect(sql).toContain("interval '30 minutes'");
    expect(sql).toContain("tehiceesto-access-email-retry");
    expect(sql).toContain("sync-status");
  });
  it("sends first-party one-time login links rather than provider redirects",()=>{
    const src=file("gift-account");
    expect(src).toContain('new URL("https://tehiceesto.com/mis-regalos")');
    expect(src).toContain('link?.properties?.hashed_token');
    expect(src).toContain('brandedAccess.hash=new URLSearchParams');
    expect(src).toContain('ACCESS_LINK:brandedAccess.toString()');
    expect(src).not.toContain('String(link.properties.action_link)');
  });
  it("exchanges email token hashes securely on the website and handles expiry",()=>{
    const client=readFileSync(join(root,"src","app","tehiceesto","mis-regalos","MyGifts.tsx"),"utf8");
    expect(client).toContain('type:"magiclink"');
    expect(client).toContain('/auth/v1/verify');
    expect(client).toContain('if(fromNewLink)');
    expect(client).toContain('clearAuthResponseFromUrl();');
    expect(client).toContain('El enlace de acceso venció o ya fue utilizado');
  });
  it("offers recovery after a failed post-purchase send",()=>{
    const src=file("order-status");
    expect(src).toContain("emailRetryDue");
    expect(src).toContain("sync-status");
  });
});
