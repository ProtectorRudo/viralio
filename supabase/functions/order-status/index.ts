const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

function defaultKey(envName: string) {
  try {
    const parsed = JSON.parse(Deno.env.get(envName) || "{}");
    return typeof parsed.default === "string" ? parsed.default : "";
  } catch {
    return "";
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "apikey, content-type",
      "access-control-allow-methods": "GET, OPTIONS",
      "cache-control": "no-store",
    },
  });
}

function validPublishableKey(req: Request) {
  const supplied = req.headers.get("apikey") || "";
  return [
    defaultKey("SUPABASE_PUBLISHABLE_KEYS"),
    defaultKey("SUPABASE_ANON_KEYS"),
  ].filter(Boolean).includes(supplied);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: json(null).headers });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  if (!validPublishableKey(req)) return json({ error: "unauthorized" }, 401);

  const code = new URL(req.url).searchParams.get("code")?.trim().toLowerCase() || "";
  if (!/^[a-f0-9]{18}$/.test(code)) return json({ error: "not_found" }, 404);

  const secret = defaultKey("SUPABASE_SECRET_KEYS");
  if (!secret) return json({ error: "server_configuration" }, 500);

  const headers = {
    apikey: secret,
    authorization: `Bearer ${secret}`,
    accept: "application/json",
  };

  const giftQuery = new URL(`${SUPABASE_URL}/rest/v1/gifts`);
  giftQuery.searchParams.set(
    "select",
    "id,public_code,status,experience_slug,giver_name,recipient_name,story_data,created_at,updated_at,published_at"
  );
  giftQuery.searchParams.set("public_code", `eq.${code}`);
  giftQuery.searchParams.set("limit", "1");

  const giftResponse = await fetch(giftQuery, { headers });
  if (!giftResponse.ok) return json({ error: "lookup_failed" }, 500);
  let gift = (await giftResponse.json())?.[0];
  if (!gift) return json({ error: "not_found" }, 404);

  const orderQuery = new URL(`${SUPABASE_URL}/rest/v1/orders`);
  orderQuery.searchParams.set(
    "select",
    "status,provider,provider_reference,checkout_url,amount_minor,currency,payment_token,paid_at,updated_at,access_email_sent_at,access_email_last_attempt_at"
  );
  orderQuery.searchParams.set("gift_id", `eq.${gift.id}`);
  orderQuery.searchParams.set("limit", "1");

  const orderResponse = await fetch(orderQuery, { headers });
  if (!orderResponse.ok) return json({ error: "order_lookup_failed" }, 500);
  let order = (await orderResponse.json())?.[0] || null;

  // If an email transport failed when the payment was credited, reopening the
  // private order page retries after a cooldown; it never grants editor access.
  const previousEmailAttempt=Date.parse(String(order?.access_email_last_attempt_at||""));
  const emailRetryDue=order?.status==="approved"&&!order?.access_email_sent_at&&
    (!Number.isFinite(previousEmailAttempt)||Date.now()-previousEmailAttempt>20*60*1000);
  if((order?.status==="pending"||emailRetryDue) && typeof order?.payment_token==="string"){
    try{
      const checkoutAction=order.status==="approved"||(order.checkout_url&&order.provider_reference)?"sync-status":"create";
      const syncResponse=await fetch(
        "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2",
        {
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({action:checkoutAction,token:order.payment_token}),
          signal:AbortSignal.timeout(12000),
        },
      );

      if(syncResponse.ok){
        const refreshedOrderResponse=await fetch(orderQuery,{headers});
        if(refreshedOrderResponse.ok){
          order=(await refreshedOrderResponse.json())?.[0]||order;
        }

        const refreshedGiftResponse=await fetch(giftQuery,{headers});
        if(refreshedGiftResponse.ok){
          gift=(await refreshedGiftResponse.json())?.[0]||gift;
        }
      }
    }catch{}
  }

  let stage = "received";
  if (gift.status === "published") stage = "ready";
  else if (order?.status === "approved" || gift.status === "paid") stage = "personalize";
  else if (order?.status === "pending" || gift.status === "awaiting_payment") stage = "payment";

  return json({
    code: gift.public_code,
    stage,
    giftStatus: gift.status,
    experienceSlug: gift.experience_slug,
    giverName: gift.giver_name,
    recipientName: gift.recipient_name,
    createdAt: gift.created_at,
    updatedAt: gift.updated_at,
    publishedAt: gift.published_at,
    order: order
      ? {
          status: order.status,
          checkoutUrl: typeof order.checkout_url === "string" && /^https:\/\//i.test(order.checkout_url) ? order.checkout_url : null,
          amountMinor: order.amount_minor,
          currency: order.currency,
          paidAt: order.paid_at,
          updatedAt: order.updated_at,
        }
      : null,
    giftUrl: gift.status === "published" ? `https://tehiceesto.com/r/${gift.public_code}` : null,
  });
});