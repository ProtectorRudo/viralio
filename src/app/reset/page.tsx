"use client";

import { useEffect } from "react";

const SESSION_KEY = /^viralio:.*:session$/;
const SAFE_SLUG = /^[a-z0-9-]+$/;

export default function ResetFunnelPage() {
  useEffect(() => {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && SESSION_KEY.test(key)) localStorage.removeItem(key);
    }

    const requested = new URLSearchParams(window.location.search).get("to") ?? "moka";
    const slug = SAFE_SLUG.test(requested) ? requested : "moka";
    window.location.replace(`/${slug}`);
  }, []);

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24 }}>
      <p>Reiniciando tu experiencia Viralio…</p>
    </main>
  );
}
