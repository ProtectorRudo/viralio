import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const src=(p:string)=>readFileSync(join(root,p),"utf8");

describe("Ailin's short, discreet affiliate link",()=>{
  const alias=src("src/app/a/page.tsx");
  const redirect=src("src/app/tehiceesto/r/[code]/AffiliateRedirect.tsx");
  const order=src("supabase/functions/order-create/index.ts");

  it("exposes an unobtrusive branded /a link while crediting Ailin through the established backend",()=>{
    expect(alias).toContain('<AffiliateRedirect code="ailin" source="short" />');
    expect(alias).toContain('url: "https://tehiceesto.com/"');
    expect(alias).toContain("index: false");
    expect(alias).not.toContain("/r/ailin");
  });

  it("persists the 30-day verified affiliate attribution before cleaning the address bar",()=>{
    expect(redirect).toContain('affiliatePublicCall<{affiliateToken:string;expiresAt:string}>("track"');
    expect(redirect).toContain('document.cookie=`thi_affiliate_token=');
    expect(redirect).toContain('document.cookie=`thi_affiliate_visitor=');
    expect(redirect).toContain('document.cookie=`thi_affiliate_code=');
    expect(redirect.indexOf('document.cookie=`thi_affiliate_token=')).toBeLessThan(redirect.indexOf('window.location.replace(dedicated?"/":"/tehiceesto")'));
    expect(redirect).toContain('window.location.replace(dedicated?"/":"/tehiceesto")');
    expect(order).toContain("resolveAffiliateAttribution(db,body.affiliateToken,order.id)");
  });
});
