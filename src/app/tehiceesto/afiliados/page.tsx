import type { Metadata } from "next";
import AffiliateDashboard from "./AffiliateDashboard";

export const metadata:Metadata={
  title:"Panel de afiliados",
  description:"Panel privado del programa de creadores de Te Hice Esto.",
  robots:{index:false,follow:false,nocache:true},
};

export default function AffiliatePage(){
  return <AffiliateDashboard/>;
}
