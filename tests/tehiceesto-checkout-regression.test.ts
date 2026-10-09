import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
import {mercadoPagoIdempotencyKey} from "../src/lib/tehiceesto-payments";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TeHiceEsto critical checkout regression gates",()=>{
  const routes=["supabase/functions/tehiceesto-checkout-v2/index.ts","src/app/tehiceesto/mercadopago/create/route.ts"];
  it.each(routes)("rejects unsupported Mercado Pago configuration in %s",(p)=>{
    const code=src(p);
    expect(code).toContain("max_installments");
    expect(code).not.toMatch(/installments_cost\s*:/);
    expect(code).not.toMatch(/interest_free\s*:/);
    expect(code).toContain("https://api.mercadopago.com/v1/orders");
    expect(code).toContain("checkout_url");
  });
  it("keeps retries on the stable idempotency-key version",()=>{
    expect(src(routes[0])).toContain("checkout-pro-config-v2:");
    expect(src("src/lib/tehiceesto-payments.ts")).toContain("checkout-pro-config-v2:");
    const token="0123456789abcdef".repeat(3);
    expect(mercadoPagoIdempotencyKey(token)).toEqual(mercadoPagoIdempotencyKey(token));
    expect(mercadoPagoIdempotencyKey(token)).not.toEqual(mercadoPagoIdempotencyKey("a".repeat(48)));
  });
  it("preserves original orders and offers self-service recovery",()=>{
    const ui=src("src/app/tehiceesto/CreatorWizard.tsx");
    expect(ui).toContain("clientRequestId: orderRequestId.current");
    expect(ui).toContain("Reintentar pago seguro");
    expect(ui).toContain("Ver seguimiento privado");
    expect(ui).not.toContain("El pago online está temporalmente fuera de servicio");
  });
  it("warns admins about stuck checkouts",()=>{
    const code=src("src/app/tehiceesto/admin/AdminPortal.tsx");
    expect(code).toContain("checkoutBlockedCount");
    expect(code).toContain("checkPaymentHealth");
  });
  it("schedules bounded safe auto-recovery",()=>{
    const code=src("supabase/migrations/20261009_tehiceesto_checkout_recovery.sql");
    expect(code).toContain("o.status='pending'");
    expect(code).toContain("o.checkout_url is null");
    expect(code).toContain("o.provider_reference is null");
    expect(code).toContain("coalesce(a.attempt_count,0)<12");
    expect(code).toContain("*/5 * * * *");
  });
});
