import type {Metadata} from "next";
import EscapeAdmin from "./EscapeAdmin";
export const metadata:Metadata={title:"Invitaciones escape · Panel",robots:{index:false,follow:false,noarchive:true}};
export default function EscapeAdminPage(){return <EscapeAdmin/>}
