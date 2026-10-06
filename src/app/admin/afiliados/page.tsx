import type { Metadata } from "next";
import AffiliateAdminDashboard from "../../tehiceesto/admin/afiliados/AffiliateAdminDashboard";

export const metadata:Metadata={title:"Afiliados · Te Hice Esto",robots:{index:false,follow:false,nocache:true}};
export default function AffiliateAdminAliasPage(){return <AffiliateAdminDashboard/>;}
