function first(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

export function publicOriginFromRequest(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const configured = environment.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) {
    const parsed = new URL(configured);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Invalid public app URL");
    return parsed.origin;
  }

  const requestUrl = new URL(request.url);
  const host = first(request.headers.get("x-forwarded-host"))
    ?? first(request.headers.get("host"))
    ?? requestUrl.host;
  const protocol = first(request.headers.get("x-forwarded-proto"))
    ?? requestUrl.protocol.slice(0, -1);
  if (protocol !== "http" && protocol !== "https") throw new Error("Invalid public app URL");
  return `${protocol}://${host}`;
}

export function merchantPublicUrl(origin: string, slug: string): string {
  const normalizedOrigin = new URL(origin).origin;
  return `${normalizedOrigin}/${encodeURIComponent(slug)}`;
}
