import type {Metadata} from "next";
import WithdrawalAdmin from "./WithdrawalAdmin";
export const metadata:Metadata={title:"Solicitudes de arrepentimiento · Panel",robots:{index:false,follow:false,noarchive:true}};
export default function WithdrawalsAdminPage(){return <WithdrawalAdmin/>}
