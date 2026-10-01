import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { viralio } from "@/application";
import { MerchantExperience } from "@/ui/merchant-experience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atlas Barber · Tu pase privado",
  description: "Abrí tu pase Atlas, compartí y descubrí un beneficio para tu próximo corte.",
};

export default async function AtlasPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  try {
    const merchant = await viralio.getMerchantForExperience("atlas-barber");
    return <MerchantExperience merchant={merchant} referralToken={ref} />;
  } catch {
    notFound();
  }
}
