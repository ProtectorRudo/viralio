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
  it("offers recovery after a failed post-purchase send",()=>{
    const src=file("order-status");
    expect(src).toContain("emailRetryDue");
    expect(src).toContain("sync-status");
  });
});
