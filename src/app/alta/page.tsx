import type { Metadata } from "next";
import { MerchantOnboarding } from "@/ui/merchant-onboarding";

export const metadata: Metadata = {
  title: "Alta de comercio · Viralio",
  description: "Provisionamiento seguro de nuevas experiencias Viralio.",
};

export default function MerchantOnboardingPage() {
  return <MerchantOnboarding />;
}
