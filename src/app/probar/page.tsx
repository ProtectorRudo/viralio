import { permanentRedirect } from "next/navigation";

/** La antigua prueba gratuita ya no forma parte de Viralio Escape. */
export default function FreeTrialRedirect() {
  permanentRedirect("/#experiencias");
}
