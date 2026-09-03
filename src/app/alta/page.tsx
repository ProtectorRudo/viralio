import type { Metadata } from "next";
import { MerchantOnboarding } from "@/ui/merchant-onboarding";
import { PilotReadinessPanel } from "@/ui/pilot-readiness-panel";

export const metadata: Metadata = {
  title: "Alta de comercio · Viralio",
  description: "Provisionamiento seguro de nuevas experiencias Viralio.",
};

export default function MerchantOnboardingPage() {
  return (
    <>
      <PilotReadinessPanel />
      <MerchantOnboarding />
    </>
  );
}
