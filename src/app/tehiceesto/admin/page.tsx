import type { Metadata } from "next";
import AdminPortal from "./AdminPortal";

export const metadata: Metadata = {
  title: "Panel interno · Te Hice Esto",
  robots: { index: false, follow: false, nocache: true },
};

export default function TeHiceEstoAdminPage(){
  return <AdminPortal/>;
}
