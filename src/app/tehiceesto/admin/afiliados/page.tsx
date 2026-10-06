import type { Metadata } from "next";
import AffiliateAdminDashboard from "./AffiliateAdminDashboard";

export const metadata:Metadata={
  title:"Afiliados · Panel interno",
  robots:{index:false,follow:false,nocache:true},
};

export default function AffiliatesAdminPage(){
  return <AffiliateAdminDashboard/>;
}
