import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

function defaultKey(envName: string) {
  try {
    const parsed = JSON.parse(Deno.env.get(envName) || "{}");
    return typeof parsed.default === "string" ? parsed.default : "";
  } catch {
    return "";
  }
}

const SECRET_KEY = defaultKey("SUPABASE_SECRET_KEYS");

function adminClient() {
  return createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cors(origin: string | null) {
  const allowed =
    origin === "https://viralio.net" ||
    origin === "https://www.viralio.net" ||
    origin === "https://tehiceesto.com" ||
    origin === "https://www.tehiceesto.com" ||
    origin?.endsWith(".vercel.app") ||
    origin?.startsWith("http://localhost:");
  return {
    "access-control-allow-origin": allowed ? origin! : "https://tehiceesto.com",
    "access-control-allow-headers": "apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}

function validPublishableKey(req: Request) {
  const supplied = req.headers.get("apikey") || "";
  return [
    defaultKey("SUPABASE_PUBLISHABLE_KEYS"),
    defaultKey("SUPABASE_ANON_KEYS"),
  ].filter(Boolean).includes(supplied);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// SYNCHRONIZED with frozen premium-v3 demo snapshot. Tests guard all nine journeys.
const recipes:Record<string,string[]>={
  pareja: ["intro","door","memories","voices","light","stars","everyday","scratch","hold","letter","finale"],
  cumpleanos: ["intro","candles","balloons","memories","light","voices","hold","letter","finale"],
  hijos: ["intro","timeline","memories","voices","light","stars","capsule","hold","letter","finale"],
  abuelos: ["intro","archive","timeline","memories","home","voices","letter","legacy","finale"],
  aniversario: ["intro","timeline","memories","rituals","chapters","letter","future","finale"],
  propuesta: ["intro","origin","memories","reasons","certainty","letter","threshold","proposal"],
  mama: ["intro","childhood","memories","care","sacrifices","voices","letter","finale"],
  papa: ["intro","memories","lessons","presence","inheritance","voices","letter","lookback","finale"],
  amistad: ["intro","casefile","memories","insidejokes","incidents","proof","letter","pact","finale"],
  secreto: ["invitation","portal","gallery","timepiece","recording","clues","confession","passage","reveal","keepsake"],
};

function cleanText(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function cleanCode(value: unknown) {
  const code = String(value || "").trim().toLowerCase();
  if (!/^[a-f0-9]{18}$/.test(code)) throw new Error("invalid_code");
  return code;
}

function safeFileName(value: unknown) {
  return cleanText(value, 120)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "recuerdo";
}


function newStudioToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(value: unknown) {
  return cleanText(value, 180).toLowerCase();
}

function normalizePhone(value: unknown) {
  return cleanText(value, 40).replace(/[^0-9+]/g, "");
}

function studioTokenValid(value: unknown) {
  return /^[a-f0-9]{64}$/.test(String(value || "").trim().toLowerCase());
}

function storyObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, any>) }
    : {};
}

async function assertStudioAccess(
  supabase: ReturnType<typeof adminClient>,
  code: string,
  rawToken: unknown,
) {
  const token = String(rawToken || "").trim().toLowerCase();
  if (!studioTokenValid(token)) throw new Error("studio_unauthorized");

  const { data: gift, error } = await supabase
    .from("gifts")
    .select("*")
    .eq("public_code", code)
    .maybeSingle();

  if (error || !gift) throw new Error("studio_not_found");

  const story = storyObject(gift.story_data);
  const creator = storyObject(story.creator);
  const hashes = new Set<string>();
  const primaryHash = String(creator.editorTokenHash || "").trim().toLowerCase();
  if (/^[a-f0-9]{64}$/.test(primaryHash)) hashes.add(primaryHash);
  if (Array.isArray(creator.editorTokenHashes)) {
    for (const item of creator.editorTokenHashes) {
      const hash = String(item || "").trim().toLowerCase();
      if (/^[a-f0-9]{64}$/.test(hash)) hashes.add(hash);
    }
  }
  const suppliedHash = await sha256(token);
  if (!hashes.size || !hashes.has(suppliedHash)) throw new Error("studio_unauthorized");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status,provider,provider_reference,amount_minor,currency,paid_at,updated_at")
    .eq("gift_id", gift.id)
    .maybeSingle();

  if (orderError) throw new Error("studio_order_lookup_failed");
  if (order?.status !== "approved") throw new Error("payment_required");

  return { gift, order, story };
}

async function signedStudioMedia(
  supabase: ReturnType<typeof adminClient>,
  giftId: string,
) {
  const { data: rows, error } = await supabase
    .from("gift_media")
    .select("id,kind,storage_path,caption,sort_order,metadata,created_at")
    .eq("gift_id", giftId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error("studio_media_lookup_failed");

  const media = rows || [];
  const paths = media.map((item) => item.storage_path).filter(Boolean);
  let signedMap = new Map<string,string>();

  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from("gift-media")
      .createSignedUrls(paths, 60 * 60);
    signedMap = new Map(
      (signed || [])
        .filter((item) => item.path && item.signedUrl)
        .map((item) => [item.path as string, item.signedUrl as string]),
    );
  }

  return media.map((item) => ({
    ...item,
    url: signedMap.get(item.storage_path) || null,
  }));
}

function canonicalRecipeForGift(gift: any, storyValue?: unknown) {
  const story = storyObject(storyValue ?? gift?.story_data);
  const creator = storyObject(story.creator);
  const stored = Array.isArray(creator.templateRecipe)
    ? creator.templateRecipe.map(String).filter(Boolean)
    : [];
  if (stored.length) return stored;

  const current = recipes[String(gift?.experience_slug || "")] || [];
  if (current.length) return [...current];

  return Array.isArray(gift?.scene_recipe)
    ? gift.scene_recipe.map(String).filter(Boolean)
    : [];
}

function cleanStudioRecipe(canonical: string[], value: unknown) {
  const requested = Array.isArray(value) ? value.map(String) : [];
  const selected = new Set(requested.filter((scene) => canonical.includes(scene)));
  if (canonical.includes("intro")) selected.add("intro");
  const terminal = canonical.includes("proposal") ? "proposal" : canonical.includes("finale") ? "finale" : canonical[canonical.length - 1];
  if (terminal) selected.add(terminal);
  return canonical.filter((scene) => selected.has(scene));
}

function studioDefaultScene(kind: string, recipe: string[]) {
  if (kind === "image" && recipe.includes("gallery")) return "gallery";
  if (kind === "image" && recipe.includes("memories")) return "memories";
  if (kind === "audio" && recipe.includes("recording")) return "recording";
  if (kind === "audio" && recipe.includes("voices")) return "voices";
  if (kind === "video" && recipe.includes("video")) return "video";
  if (kind === "video" && recipe.includes("memories")) return "memories";
  return recipe[0] || "intro";
}

async function creatorIpHash(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
  const day = new Date().toISOString().slice(0,10);
  return sha256(`${day}:${ip}`);
}

async function assertDraft(supabase: ReturnType<typeof adminClient>, code: string) {
  const { data } = await supabase
    .from("gifts")
    .select("id,status,scene_recipe,created_at")
    .eq("public_code", code)
    .maybeSingle();
  if (!data || !["draft","awaiting_payment"].includes(data.status)) throw new Error("draft_not_found");
  return data;
}

async function ensurePendingOrder(
  supabase: ReturnType<typeof adminClient>,
  giftId: string,
  defaultPriceMinor: number | null,
) {
  const { data: existing } = await supabase
    .from("orders")
    .select("id,status,payment_token,amount_minor,checkout_url")
    .eq("gift_id", giftId)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (existing.status !== "pending") {
      patch.status = "pending";
      patch.paid_at = null;
    }
    if (
      existing.amount_minor == null &&
      Number.isInteger(defaultPriceMinor) &&
      Number(defaultPriceMinor) > 0
    ) {
      patch.amount_minor = defaultPriceMinor;
      patch.currency = "ARS";
    }
    if (Object.keys(patch).length > 0) {
      patch.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("orders")
        .update(patch)
        .eq("id", existing.id)
        .select("id,status,payment_token,amount_minor,checkout_url")
        .single();
      if (error || !data) throw new Error("order_reset_failed");
      return data;
    }
    return existing;
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      gift_id: giftId,
      provider: "mercadopago",
      status: "pending",
      currency: "ARS",
      amount_minor:
        Number.isInteger(defaultPriceMinor) && Number(defaultPriceMinor) > 0
          ? defaultPriceMinor
          : null,
    })
    .select("id,status,payment_token,amount_minor,checkout_url")
    .single();

  if (error || !data) throw new Error("order_create_failed");
  return data;
}

async function maybeCreateAutomaticCheckout(order: {
  payment_token?: string | null;
  amount_minor?: number | null;
  checkout_url?: string | null;
}, enabled: boolean) {
  if (
    !enabled ||
    !order.payment_token ||
    !Number.isInteger(order.amount_minor) ||
    Number(order.amount_minor) <= 0
  ) return false;

  if (order.checkout_url) return true;

  try {
    const response = await fetch(
      "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create",
          token: order.payment_token,
        }),
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!response.ok) {
      console.error("creator_auto_checkout_failed", response.status, await response.text());
      return false;
    }
    const payload = await response.json().catch(() => ({}));
    return typeof payload?.checkoutUrl === "string";
  } catch (error) {
    console.error("creator_auto_checkout_failed", error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (req.method !== "POST") return json(origin, { error: "method_not_allowed" }, 405);
  if (!validPublishableKey(req)) return json(origin, { error: "unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(origin, { error: "invalid_json" }, 400);
  }

  const action = String(body.action || "");
  const supabase = adminClient();


  if (action === "recoverStudioAccess") {
    // Recovery now requires proving control of the buyer's email through gift-account.
    // Keep the retired action explicit so old direct callers cannot obtain editor access
    // from a public gift code plus a known email address.
    return json(origin, { error: "recovery_moved" }, 410);
  }

  if (action === "openStudio") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift, order } = await assertStudioAccess(supabase, code, body.editorToken);
      const media = await signedStudioMedia(supabase, gift.id);
      const safeGift = { ...gift };
      delete safeGift.id;
      const story = storyObject(safeGift.story_data);
      if (story.creator) {
        const creator = { ...story.creator };
        delete creator.editorTokenHash;
        delete creator.editorTokenHashes;
        delete creator.ipHash;
        safeGift.story_data = { ...story, creator };
      }
      return json(origin, { gift: safeGift, order, media });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "studio_failed";
      if (reason === "payment_required") return json(origin, { error: reason }, 409);
      if (reason === "studio_unauthorized") return json(origin, { error: reason }, 401);
      if (reason === "studio_not_found") return json(origin, { error: reason }, 404);
      return json(origin, { error: "studio_failed" }, 500);
    }
  }

  if (action === "saveStudioBasics") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift, story } = await assertStudioAccess(supabase, code, body.editorToken);
      const giverName = cleanText(body.giverName, 80);
      const recipientName = cleanText(body.recipientName, 80);
      if (!giverName || !recipientName) return json(origin, { error: "missing_people" }, 400);

      const keyDate = cleanText(body.keyDate, 20);
      if (keyDate && !/^\d{4}-\d{2}-\d{2}$/.test(keyDate)) {
        return json(origin, { error: "invalid_date" }, 400);
      }

      const { error } = await supabase
        .from("gifts")
        .update({
          giver_name: giverName,
          recipient_name: recipientName,
          occasion: cleanText(body.occasion, 120) || null,
          feeling: cleanText(body.feeling, 80) || null,
          opening_text: cleanText(body.openingText, 5000) || null,
          letter_text: cleanText(body.letterText, 14000) || null,
          closing_text: cleanText(body.closingText, 5000) || null,
          music_url: cleanText(body.musicUrl, 700) || null,
          story_data: {
            ...story,
            relationship: cleanText(body.relationship, 5000),
            keyDate,
            anecdote: cleanText(body.anecdote, 4000),
            creator: {
              ...(story.creator || {}),
              lastEditedAt: new Date().toISOString(),
            },
          },
        })
        .eq("id", gift.id);

      if (error) return json(origin, { error: "studio_save_failed" }, 500);
      return json(origin, { ok: true });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "studio_save_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }

  if (action === "saveStudioRecipe") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift, story } = await assertStudioAccess(supabase, code, body.editorToken);
      const recipe = (gift.template_version==="premium-v3" || gift.template_version==="secret-v1")
        ? canonicalRecipeForGift(gift, story) // Preserve every model scene: personalization changes content, not layout.
        : cleanStudioRecipe(canonicalRecipeForGift(gift, story), body.sceneRecipe);
      if (recipe.length < 2) return json(origin, { error: "recipe_too_short" }, 400);

      const { error } = await supabase
        .from("gifts")
        .update({
          scene_recipe: recipe,
          story_data: {
            ...story,
            creator: { ...(story.creator || {}), lastEditedAt: new Date().toISOString() },
          },
        })
        .eq("id", gift.id);
      if (error) return json(origin, { error: "studio_recipe_failed" }, 500);
      return json(origin, { ok: true, sceneRecipe: recipe });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "studio_recipe_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }

  if (action === "saveStudioSceneText" || action === "restoreStudioSceneText") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift, story } = await assertStudioAccess(supabase, code, body.editorToken);
      const canonical = canonicalRecipeForGift(gift, story);
      const scene = cleanText(body.scene, 80);
      const sourceText = cleanText(body.source, 5000);
      const replacement = cleanText(body.replacement, 5000);
      if (!canonical.includes(scene) || !sourceText) {
        return json(origin, { error: "invalid_scene_text" }, 400);
      }

      const raw = story.sceneContent && typeof story.sceneContent === "object" && !Array.isArray(story.sceneContent)
        ? story.sceneContent
        : {};
      const sceneContent: Record<string,Record<string,string>> = {};
      for (const [sceneKey, entries] of Object.entries(raw as Record<string,unknown>)) {
        if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
        const clean: Record<string,string> = {};
        for (const [key, value] of Object.entries(entries as Record<string,unknown>)) {
          if (typeof value === "string" && key.trim()) clean[key] = value;
        }
        if (Object.keys(clean).length) sceneContent[sceneKey] = clean;
      }

      const entries = { ...(sceneContent[scene] || {}) };
      if (action === "saveStudioSceneText") {
        entries[sourceText] = replacement;
        sceneContent[scene] = entries;
      } else {
        delete entries[sourceText];
        if (Object.keys(entries).length) sceneContent[scene] = entries;
        else delete sceneContent[scene];
      }

      const { error } = await supabase
        .from("gifts")
        .update({
          story_data: {
            ...story,
            sceneContent,
            creator: { ...(story.creator || {}), lastEditedAt: new Date().toISOString() },
          },
        })
        .eq("id", gift.id);
      if (error) return json(origin, { error: "studio_text_failed" }, 500);
      return json(origin, { ok: true, sceneContent });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "studio_text_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }

  if (action === "prepareStudioUpload") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift } = await assertStudioAccess(supabase, code, body.editorToken);
      const mimeType = cleanText(body.mimeType, 100).toLowerCase();
      const size = Number(body.size || 0);
      const fileName = safeFileName(body.fileName);
      const kind =
        /^image\//.test(mimeType) ? "image" :
        /^audio\//.test(mimeType) ? "audio" :
        /^video\//.test(mimeType) ? "video" : "";

      const allowed =
        /^image\/(jpeg|png|webp|heic|heif)$/.test(mimeType) ||
        /^audio\/(mpeg|mp4|webm|wav|x-m4a|m4a|ogg|opus)$/.test(mimeType) ||
        /^video\/(mp4|webm|quicktime)$/.test(mimeType);

      if (!kind || !allowed || size <= 0 || size > 50 * 1024 * 1024) {
        return json(origin, { error: "invalid_media" }, 400);
      }

      const { count } = await supabase
        .from("gift_media")
        .select("*", { count: "exact", head: true })
        .eq("gift_id", gift.id);
      if ((count || 0) >= 30) return json(origin, { error: "media_limit" }, 400);

      const path = code + "/studio-" + crypto.randomUUID() + "-" + fileName;
      const { data, error } = await supabase.storage
        .from("gift-media")
        .createSignedUploadUrl(path);
      if (error || !data) return json(origin, { error: "upload_prepare_failed" }, 500);
      return json(origin, { path, token: data.token, kind });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "upload_prepare_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }

  if (action === "registerStudioMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift } = await assertStudioAccess(supabase, code, body.editorToken);
      const storagePath = cleanText(body.storagePath, 500);
      const kind = cleanText(body.kind, 20);
      if (!storagePath.startsWith(code + "/studio-") || !["image","audio","video"].includes(kind)) {
        return json(origin, { error: "invalid_media" }, 400);
      }

      const { count } = await supabase
        .from("gift_media")
        .select("*", { count: "exact", head: true })
        .eq("gift_id", gift.id);
      if ((count || 0) >= 30) return json(origin, { error: "media_limit" }, 400);

      const recipe = Array.isArray(gift.scene_recipe) ? gift.scene_recipe.map(String) : [];
      const canonical = canonicalRecipeForGift(gift);
      const requestedScene = cleanText(body.scene, 80);
      const scene = requestedScene && canonical.includes(requestedScene)
        ? requestedScene
        : studioDefaultScene(kind, canonical);
      const { error } = await supabase.from("gift_media").insert({
        gift_id: gift.id,
        kind,
        storage_path: storagePath,
        caption: cleanText(body.caption, 1000) || null,
        sort_order: count || 0,
        metadata: {
          originalName: cleanText(body.originalName, 180),
          mimeType: cleanText(body.mimeType, 100),
          size: Number(body.size || 0),
          fit: "cover",
          position: "center",
          scene,
          source: "studio",
          ...(kind === "audio" ? { role: "voice" } : {}),
        },
      });
      if (error) return json(origin, { error: "media_register_failed" }, 500);

      if (scene && canonical.includes(scene) && !recipe.includes(scene)) {
        const reactivated = canonical.filter((item) => recipe.includes(item) || item === scene);
        await supabase
          .from("gifts")
          .update({ scene_recipe: reactivated })
          .eq("id", gift.id);
      }

      return json(origin, { ok: true });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "media_register_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }


  if (action === "replaceStudioMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift } = await assertStudioAccess(supabase, code, body.editorToken);
      const mediaId = cleanText(body.mediaId, 80);
      const storagePath = cleanText(body.storagePath, 500);
      const kind = cleanText(body.kind, 20);

      const { data: media } = await supabase
        .from("gift_media")
        .select("kind,storage_path,metadata")
        .eq("id", mediaId)
        .eq("gift_id", gift.id)
        .maybeSingle();

      if (
        !media ||
        media.kind !== kind ||
        !storagePath.startsWith(code + "/studio-")
      ) {
        return json(origin, { error: "invalid_media" }, 400);
      }

      const { error } = await supabase
        .from("gift_media")
        .update({
          storage_path: storagePath,
          metadata: {
            ...(media.metadata || {}),
            originalName: cleanText(body.originalName, 180),
            mimeType: cleanText(body.mimeType, 100),
            size: Number(body.size || 0),
            source: "studio",
          },
        })
        .eq("id", mediaId)
        .eq("gift_id", gift.id);

      if (error) return json(origin, { error: "media_replace_failed" }, 500);

      if (media.storage_path && media.storage_path !== storagePath) {
        await supabase.storage.from("gift-media").remove([media.storage_path]);
      }

      return json(origin, { ok: true });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "media_replace_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }

  if (action === "updateStudioMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift } = await assertStudioAccess(supabase, code, body.editorToken);
      const mediaId = cleanText(body.mediaId, 80);
      const { data: media } = await supabase
        .from("gift_media")
        .select("kind,metadata")
        .eq("id", mediaId)
        .eq("gift_id", gift.id)
        .maybeSingle();
      if (!media) return json(origin, { error: "media_not_found" }, 404);

      const recipe = Array.isArray(gift.scene_recipe) ? gift.scene_recipe.map(String) : [];
      const requestedScene = cleanText(body.scene, 80);
      const scene = recipe.includes(requestedScene)
        ? requestedScene
        : (String(media.metadata?.scene || "") || studioDefaultScene(media.kind, recipe));
      const fit = body.fit === "contain" ? "contain" : "cover";
      const position = ["center","top","bottom","left","right"].includes(String(body.position))
        ? String(body.position) : "center";
      const role = media.kind === "audio" && body.role === "soundtrack" ? "soundtrack" : media.kind === "audio" ? "voice" : undefined;

      if (role === "soundtrack") {
        const { data: other } = await supabase
          .from("gift_media")
          .select("id,metadata")
          .eq("gift_id", gift.id)
          .eq("kind", "audio")
          .neq("id", mediaId);
        for (const row of other || []) {
          if (row.metadata?.role !== "soundtrack") continue;
          await supabase
            .from("gift_media")
            .update({ metadata: { ...(row.metadata || {}), role: "voice" } })
            .eq("id", row.id)
            .eq("gift_id", gift.id);
        }
      }

      const { error } = await supabase
        .from("gift_media")
        .update({
          caption: cleanText(body.caption, 1000) || null,
          metadata: {
            ...(media.metadata || {}),
            fit,
            position,
            scene,
            ...(role ? { role } : {}),
          },
        })
        .eq("id", mediaId)
        .eq("gift_id", gift.id);
      if (error) return json(origin, { error: "media_update_failed" }, 500);
      return json(origin, { ok: true });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "media_update_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }

  if (action === "reorderStudioMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift } = await assertStudioAccess(supabase, code, body.editorToken);
      const ids = Array.isArray(body.mediaIds) ? body.mediaIds.map(String).slice(0, 30) : [];
      for (let index = 0; index < ids.length; index += 1) {
        const { error } = await supabase
          .from("gift_media")
          .update({ sort_order: index })
          .eq("id", ids[index])
          .eq("gift_id", gift.id);
        if (error) return json(origin, { error: "media_reorder_failed" }, 500);
      }
      return json(origin, { ok: true });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "media_reorder_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }

  if (action === "deleteStudioMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift } = await assertStudioAccess(supabase, code, body.editorToken);
      const mediaId = cleanText(body.mediaId, 80);
      const { data: media } = await supabase
        .from("gift_media")
        .select("storage_path")
        .eq("id", mediaId)
        .eq("gift_id", gift.id)
        .maybeSingle();
      if (!media) return json(origin, { error: "media_not_found" }, 404);

      await supabase.storage.from("gift-media").remove([media.storage_path]);
      await supabase.from("gift_media").delete().eq("id", mediaId).eq("gift_id", gift.id);
      return json(origin, { ok: true });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "media_delete_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }

  if (action === "publishStudio") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    try {
      const { gift, story } = await assertStudioAccess(supabase, code, body.editorToken);
      if (!cleanText(gift.recipient_name, 80) || gift.recipient_name === "A definir") {
        return json(origin, { error: "recipient_required" }, 400);
      }

      const { data: publishMedia } = await supabase
        .from("gift_media")
        .select("kind,metadata")
        .eq("gift_id", gift.id);

      const hasPhoto = (publishMedia || []).some((item) => item.kind === "image");
      const hasVoice = (publishMedia || []).some(
        (item) => item.kind === "audio" && item.metadata?.role !== "soundtrack",
      );
      const hasVideo = (publishMedia || []).some((item) => item.kind === "video");
      const canonical = canonicalRecipeForGift(gift, story);
      let publishRecipe = (gift.template_version==="premium-v3" || gift.template_version==="secret-v1")
        ? [...canonical] // The purchased demo's full journey is guaranteed.
        : Array.isArray(gift.scene_recipe)
          ? gift.scene_recipe.map(String)
          : [...canonical];

      if (gift.template_version!=="premium-v3" && gift.template_version!=="secret-v1" && !hasPhoto) publishRecipe = publishRecipe.filter((scene) => scene !== "memories");
      if (gift.template_version!=="premium-v3" && gift.template_version!=="secret-v1" && !hasVoice) publishRecipe = publishRecipe.filter((scene) => scene !== "voices");
      if (gift.template_version!=="premium-v3" && gift.template_version!=="secret-v1" && !hasVideo) publishRecipe = publishRecipe.filter((scene) => scene !== "video");
      if (canonical.includes("intro") && !publishRecipe.includes("intro")) publishRecipe.unshift("intro");
      const terminal = canonical.includes("proposal") ? "proposal" : canonical.includes("finale") ? "finale" : canonical[canonical.length - 1];
      if (terminal && !publishRecipe.includes(terminal)) publishRecipe.push(terminal);
      publishRecipe = canonical.filter((scene) => publishRecipe.includes(scene));

      const { error } = await supabase
        .from("gifts")
        .update({
          status: "published",
          published_at: gift.published_at || new Date().toISOString(),
          scene_recipe: publishRecipe,
          story_data: {
            ...story,
            creator: {
              ...(story.creator || {}),
              completedAt: new Date().toISOString(),
              lastEditedAt: new Date().toISOString(),
            },
          },
        })
        .eq("id", gift.id);
      if (error) return json(origin, { error: "publish_failed" }, 500);
      return json(origin, { ok: true, giftUrl: "https://tehiceesto.com/r/" + code });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "publish_failed";
      return json(origin, { error: reason }, reason === "payment_required" ? 409 : 401);
    }
  }

  if (action === "submitDraft") {
    if (cleanText(body.website, 120)) return json(origin, { error: "invalid_input" }, 400);

    const experienceSlug = cleanText(body.experienceSlug, 40);
    const giverName = cleanText(body.giverName, 80);
    const recipientName = cleanText(body.recipientName, 80);
    const feeling = cleanText(body.feeling, 80);
    const relationship = cleanText(body.relationship, 5000);
    const keyDate = cleanText(body.keyDate, 20);
    const anecdote = cleanText(body.anecdote, 4000);
    const openingText = cleanText(body.openingText, 5000);
    const letterText = cleanText(body.letterText, 14000);
    const closingText = cleanText(body.closingText, 5000);
    const musicUrl = cleanText(body.musicUrl, 700);

    if (!recipes[experienceSlug] || !giverName || !recipientName) {
      return json(origin, { error: "invalid_input" }, 400);
    }
    if (keyDate && !/^\d{4}-\d{2}-\d{2}$/.test(keyDate)) {
      return json(origin, { error: "invalid_date" }, 400);
    }

    const ipHash = await creatorIpHash(req);
    const now = new Date().toISOString();
    const requestedCode = String(body.code || "").trim().toLowerCase();

    const { data: commerce } = await supabase
      .from("commerce_settings")
      .select("default_price_minor,auto_checkout_enabled")
      .eq("id", "default")
      .maybeSingle();
    const defaultPriceMinor =
      Number.isInteger(commerce?.default_price_minor) &&
      Number(commerce?.default_price_minor) > 0
        ? Number(commerce?.default_price_minor)
        : null;
    const autoCheckoutEnabled =
      commerce?.auto_checkout_enabled === true && defaultPriceMinor !== null;

    if (requestedCode) {
      if (!/^[a-f0-9]{18}$/.test(requestedCode)) {
        return json(origin, { error: "invalid_code" }, 400);
      }

      const { data: existing } = await supabase
        .from("gifts")
        .select("id,status,story_data")
        .eq("public_code", requestedCode)
        .maybeSingle();

      if (!existing || !["draft","awaiting_payment"].includes(existing.status)) {
        return json(origin, { error: "draft_locked" }, 409);
      }

      const existingStory =
        existing.story_data && typeof existing.story_data === "object" && !Array.isArray(existing.story_data)
          ? existing.story_data
          : {};

      const { error } = await supabase
        .from("gifts")
        .update({
          status: "awaiting_payment",
          experience_slug: experienceSlug,
          template_version: experienceSlug==="secreto" ? "secret-v1" : "premium-v3",
          giver_name: giverName,
          recipient_name: recipientName,
          feeling: feeling || null,
          opening_text: openingText || null,
          letter_text: letterText || null,
          closing_text: closingText || null,
          music_url: musicUrl || null,
          scene_recipe: recipes[experienceSlug],
          story_data: {
            ...existingStory,
            relationship,
            keyDate,
            anecdote,
            creator: {
              ...(existingStory.creator || {}),
              submitted: true,
              submittedAt: now,
              ipHash,
            },
          },
        })
        .eq("id", existing.id);

      if (error) return json(origin, { error: "draft_update_failed" }, 500);
      let order;
      try { order = await ensurePendingOrder(supabase, existing.id, defaultPriceMinor); }
      catch { return json(origin, { error: "order_create_failed" }, 500); }
      const checkoutReady = await maybeCreateAutomaticCheckout(order, autoCheckoutEnabled);
      return json(origin, {
        code: requestedCode,
        updated: true,
        payment: "pending",
        checkoutReady,
      });
    }

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("gifts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since)
      .eq("story_data->creator->>ipHash", ipHash);

    if ((count || 0) >= 6) {
      return json(origin, { error: "too_many_drafts" }, 429);
    }

    const { data, error } = await supabase
      .from("gifts")
      .insert({
        status: "awaiting_payment",
        experience_slug: experienceSlug,
        template_version: experienceSlug==="secreto" ? "secret-v1" : "premium-v3",
        giver_name: giverName,
        recipient_name: recipientName,
        feeling: feeling || null,
        opening_text: openingText || null,
        letter_text: letterText || null,
        closing_text: closingText || null,
        music_url: musicUrl || null,
        scene_recipe: recipes[experienceSlug],
        story_data: {
          relationship,
          keyDate,
          anecdote,
          script: {},
          creator: {
            submitted: true,
            submittedAt: now,
            ipHash,
          },
        },
        theme_data: {},
      })
      .select("id,public_code")
      .single();

    if (error || !data) return json(origin, { error: "draft_create_failed" }, 500);
    let order;
    try { order = await ensurePendingOrder(supabase, data.id, defaultPriceMinor); }
    catch { return json(origin, { error: "order_create_failed" }, 500); }
    const checkoutReady = await maybeCreateAutomaticCheckout(order, autoCheckoutEnabled);
    return json(origin, {
      code: data.public_code,
      updated: false,
      payment: "pending",
      checkoutReady,
    });
  }

  if (action === "prepareUpload") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const mimeType = cleanText(body.mimeType, 100).toLowerCase();
    const size = Number(body.size || 0);
    const fileName = safeFileName(body.fileName);

    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(mimeType) || size <= 0 || size > 15 * 1024 * 1024) {
      return json(origin, { error: "invalid_media" }, 400);
    }

    let gift;
    try { gift = await assertDraft(supabase, code); }
    catch { return json(origin, { error: "draft_not_found" }, 404); }

    const { count } = await supabase
      .from("gift_media")
      .select("*", { count: "exact", head: true })
      .eq("gift_id", gift.id);
    if ((count || 0) >= 10) return json(origin, { error: "media_limit" }, 400);

    const path = `${code}/creator-${crypto.randomUUID()}-${fileName}`;
    const { data, error } = await supabase.storage
      .from("gift-media")
      .createSignedUploadUrl(path);

    if (error || !data) return json(origin, { error: "upload_prepare_failed" }, 500);
    return json(origin, { path, token: data.token });
  }

  if (action === "resetCreatorMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    let gift;
    try { gift = await assertDraft(supabase, code); }
    catch { return json(origin, { error: "draft_not_found" }, 404); }

    const { data: rows, error: lookupError } = await supabase
      .from("gift_media")
      .select("id,storage_path,metadata")
      .eq("gift_id", gift.id);

    if (lookupError) return json(origin, { error: "media_lookup_failed" }, 500);

    const creatorRows = (rows || []).filter((row) => row.metadata?.source === "creator");
    const paths = creatorRows.map((row) => row.storage_path).filter(Boolean);
    if (paths.length) await supabase.storage.from("gift-media").remove(paths);

    const ids = creatorRows.map((row) => row.id);
    if (ids.length) {
      const { error } = await supabase.from("gift_media").delete().in("id", ids).eq("gift_id", gift.id);
      if (error) return json(origin, { error: "media_reset_failed" }, 500);
    }

    return json(origin, { ok: true, removed: ids.length });
  }

  if (action === "registerMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const storagePath = cleanText(body.storagePath, 500);
    if (!storagePath.startsWith(`${code}/creator-`)) {
      return json(origin, { error: "invalid_path" }, 400);
    }

    let gift;
    try { gift = await assertDraft(supabase, code); }
    catch { return json(origin, { error: "draft_not_found" }, 404); }

    const { count } = await supabase
      .from("gift_media")
      .select("*", { count: "exact", head: true })
      .eq("gift_id", gift.id);
    if ((count || 0) >= 10) return json(origin, { error: "media_limit" }, 400);

    const recipe = Array.isArray(gift.scene_recipe) ? gift.scene_recipe.map(String) : [];
    const scene = recipe.includes("memories") ? "memories" : (recipe[0] || "intro");
    const caption = cleanText(body.caption, 1000) || null;

    const { error } = await supabase.from("gift_media").insert({
      gift_id: gift.id,
      kind: "image",
      storage_path: storagePath,
      caption,
      sort_order: count || 0,
      metadata: {
        originalName: cleanText(body.originalName, 180),
        mimeType: cleanText(body.mimeType, 100),
        size: Number(body.size || 0),
        fit: "cover",
        position: "center",
        scene,
        source: "creator",
      },
    });

    if (error) return json(origin, { error: "media_register_failed" }, 500);
    return json(origin, { ok: true });
  }

  return json(origin, { error: "unknown_action" }, 400);
});