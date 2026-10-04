"use client";

export const SUPABASE_URL = "https://efvvadfxuyieswdqnsjg.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";
export const CREATOR_API = `${SUPABASE_URL}/functions/v1/creator-api`;

export async function creatorCall<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(CREATOR_API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(data?.error || "creator_request_failed"));
  return data as T;
}

export async function uploadCreatorFile(path: string, token: string, file: File) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const url =
    `${SUPABASE_URL}/storage/v1/object/upload/sign/gift-media/${encodedPath}?token=${encodeURIComponent(token)}`;

  const form = new FormData();
  form.append("cacheControl", "3600");
  form.append("", file);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "x-upsert": "false",
    },
    body: form,
  });

  if (!response.ok) throw new Error("signed_upload_failed");
}
