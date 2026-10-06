import type { Metadata } from "next";
import AffiliateDashboard from "./AffiliateDashboard";

export const metadata:Metadata={
  title:"Panel de afiliado",
  robots:{index:false,follow:false,nocache:true},
};

export default async function AffiliateDashboardPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return <AffiliateDashboard slug={slug}/>;
}
