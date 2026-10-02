import type { Metadata } from "next";
import { cookies } from "next/headers";
import { OPERATOR_SESSION_COOKIE, verifyOperatorSessionToken } from "@/security/merchant-auth";
import { MerchantOnboarding } from "@/ui/merchant-onboarding";
import { PilotReadinessPanel } from "@/ui/pilot-readiness-panel";

export const metadata: Metadata = {
  title: "Alta de comercio · Viralio",
  description: "Provisionamiento seguro de nuevas experiencias Viralio.",
};

export default async function MerchantOnboardingPage() {
  const store = await cookies();
  const operatorAuthenticated = Boolean(
    verifyOperatorSessionToken(store.get(OPERATOR_SESSION_COOKIE)?.value),
  );

  return (
    <>
      <PilotReadinessPanel />
      <MerchantOnboarding operatorAuthenticated={operatorAuthenticated} />
    </>
  );
}
