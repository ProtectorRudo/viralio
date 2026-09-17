import { describe, expect, it } from "vitest";
import { defaultCustomizationForAccount } from "@/config/merchant-accounts";
import type { MerchantAccount } from "@/domain/types";

function account(template: MerchantAccount["template"]): MerchantAccount {
  return {
    id: `merchant_test_${template}`,
    slug: `test-${template}`,
    name: "Comercio Test",
    template,
    businessType: template === "coffee" ? "Cafetería" : template === "barber" ? "Peluquería" : "Joyería",
    pinSalt: "test-salt",
    pinHash: "test-hash",
    createdAt: "2026-09-17T00:00:00.000Z",
  };
}

describe("WhatsApp-only copy invariant", () => {
  for (const template of ["generic", "coffee", "barber"] as const) {
    it(`preserves the approved WhatsApp sharing contract for ${template} even when AI copy disagrees`, () => {
      const customization = defaultCustomizationForAccount(account(template), "5492215550000", {
        brandCopy: {
          heroTitle: "Una propuesta personalizada",
          shareTitle: "Elegí una red social para continuar",
          shareCopy: "Compartilo donde quieras para desbloquear tu beneficio.",
        },
      });

      expect(customization.copy.heroTitle).toBe("Una propuesta personalizada");
      expect(customization.copy.shareTitle).toBe("Antes de descubrir el tuyo, regalale uno a alguien.");
      expect(customization.copy.shareCopy).toBe("Compartilo por WhatsApp. La otra persona recibe su propio regalo y el tuyo sigue siendo solo tuyo.");
    });
  }
});
