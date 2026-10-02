import Link from "next/link";
import { cookies } from "next/headers";
import styles from "./maurilio-fallback.module.css";
import PremiumPaidReveal from "./PremiumPaidReveal";
import {
  invokeMaurilioAccess,
  type AccessLibrary,
  type AccessTier,
  validSubjectId,
} from "@/lib/maurilio-access-server";

function unavailable(reason: "access" | "report") {
  return (
    <section className={styles.subview}>
      <div className={styles.emptyLedger}>
        <span>
          {reason === "access" ? "ACCESS REQUIRED" : "REPORT UNAVAILABLE"}
        </span>
        <h2>
          {reason === "access"
            ? "Este informe no está desbloqueado en este acceso."
            : "El informe no está disponible."}
        </h2>
        <p>
          {reason === "access"
            ? "Usá Mis informes para recuperar un acceso comprado en otro navegador."
            : "El entitlement sigue siendo válido; el contenido puede haber sido retirado o todavía no estar publicado."}
        </p>
        <Link className={styles.inlineAction} href="/maurilio/mis-informes">
          Ir a Mis informes →
        </Link>
      </div>
    </section>
  );
}

export default async function PremiumReportView({
  tier,
  matchday,
}: {
  tier: string | undefined;
  matchday: string | undefined;
}) {
  if (tier !== "pro" && tier !== "elite") return unavailable("report");
  if (!matchday) return unavailable("report");

  const store = await cookies();
  const subjectId = store.get("maurilio_sid")?.value;
  if (!validSubjectId(subjectId)) return unavailable("access");

  const library = await invokeMaurilioAccess<AccessLibrary>({
    action: "library",
    subjectId,
  });

  if (!library.ok) return unavailable("access");

  const entitled = library.data.reports.some(
    (report) =>
      report.tier === (tier as AccessTier) &&
      report.matchday === matchday,
  );

  if (!entitled) return unavailable("access");

  return (
    <section className={styles.subview}>
      <PremiumPaidReveal tier={tier as AccessTier} matchday={matchday} />
    </section>
  );
}
