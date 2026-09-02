import { redirect } from "next/navigation";

export default async function LegacyValidateRewardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/premio/${encodeURIComponent(token)}`);
}
