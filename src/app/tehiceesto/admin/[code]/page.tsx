import type { Metadata } from "next";
import AdminGiftEditor from "../AdminGiftEditor";

export const metadata: Metadata = {
  title: "Editar regalo · Te Hice Esto",
  robots: { index: false, follow: false, nocache: true },
};

export default async function GiftEditorPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <AdminGiftEditor code={code} />;
}
