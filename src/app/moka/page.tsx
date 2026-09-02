import { MokaExperience } from "@/ui/moka-experience";

export default async function MokaPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return <MokaExperience referralToken={ref} />;
}
