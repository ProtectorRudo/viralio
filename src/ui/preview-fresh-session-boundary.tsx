"use client";

import { useEffect, useState } from "react";
import type { Merchant } from "@/domain/types";
import { MerchantExperience } from "@/ui/merchant-experience";

export function PreviewFreshSessionBoundary({
  merchant,
  referralToken,
  forceFreshSession = false,
}: {
  merchant: Merchant;
  referralToken?: string;
  forceFreshSession?: boolean;
}) {
  const [ready, setReady] = useState(!forceFreshSession);

  useEffect(() => {
    if (!forceFreshSession) return;

    localStorage.removeItem(`viralio:${merchant.slug}:session`);
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, [forceFreshSession, merchant.slug]);

  if (!ready) return null;

  return <MerchantExperience merchant={merchant} referralToken={referralToken} />;
}
