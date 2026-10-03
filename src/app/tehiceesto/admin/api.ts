"use client";

export const SUPABASE_URL = "https://efvvadfxuyieswdqnsjg.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";
export const ADMIN_API = `${SUPABASE_URL}/functions/v1/admin-api`;
export const SESSION_KEY = "thi_admin_session";

export async function adminCall<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {},
  withSession = true,
): Promise<T> {
  const session =
    typeof window !== "undefined" ? window.sessionStorage.getItem(SESSION_KEY) || "" : "";

  const response = await fetch(ADMIN_API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
      ...(withSession && session ? { "x-admin-session": session } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && withSession) {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event("thi-admin-session-expired"));
  }

  if (!response.ok) {
    throw new Error(String(data?.error || "admin_request_failed"));
  }

  return data as T;
}

export async function uploadSignedFile(
  path: string,
  token: string,
  file: File,
) {
  const encodedPath = path
    .split("/")
    .map(encodeURIComponent)
    .join("/");

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

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("signed upload failed", response.status, text);
    throw new Error("signed_upload_failed");
  }
}
