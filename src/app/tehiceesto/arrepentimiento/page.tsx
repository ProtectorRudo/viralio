import type {Metadata} from "next";
import WithdrawalForm from "./WithdrawalForm";
export const metadata:Metadata={title:"Botón de arrepentimiento · Te Hice Esto",description:"Solicitá la revocación de una compra en Te Hice Esto sin registrarte.",robots:{index:true,follow:true}};
export default function ConsumerWithdrawalPage(){return <WithdrawalForm/>}
