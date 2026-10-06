import type { Metadata } from "next";
import AffiliateDashboard from "../tehiceesto/afiliados/AffiliateDashboard";

export const metadata:Metadata={title:"Panel de afiliados · Te Hice Esto",robots:{index:false,follow:false,nocache:true}};
export default function AffiliateAliasPage(){return <AffiliateDashboard/>;}
