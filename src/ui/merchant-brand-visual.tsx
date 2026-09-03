import Image from "next/image";
import type { Merchant } from "@/domain/types";
import { BrandIcon } from "@/ui/brand-icon";

export function MerchantBrandVisual({
  merchant,
  mode = "symbol",
  className = "",
  decorative = true,
  size = 54,
}: {
  merchant: Merchant;
  mode?: "mark" | "symbol";
  className?: string;
  decorative?: boolean;
  size?: number;
}) {
  if (merchant.theme.logoDataUrl) {
    return (
      <Image
        className={className}
        src={merchant.theme.logoDataUrl}
        alt={decorative ? "" : `Logo de ${merchant.theme.displayName}`}
        width={size}
        height={size}
        unoptimized
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }
  if (mode === "mark") {
    return <span className={className} aria-hidden={decorative ? "true" : undefined}>{merchant.theme.monogram}</span>;
  }
  return <BrandIcon category={merchant.theme.category} className={className} />;
}
