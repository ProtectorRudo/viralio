import type {Metadata} from "next";
import EscapeAdmin from "../EscapeAdmin";
export const metadata:Metadata={title:"Editar escape · Panel",robots:{index:false,follow:false,noarchive:true}};
export default async function EscapeGiftEditorPage({params}:{params:Promise<{code:string}>}){
 const {code}=await params;return <EscapeAdmin code={code}/>;
}
