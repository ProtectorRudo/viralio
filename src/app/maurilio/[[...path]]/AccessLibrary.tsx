import Link from "next/link";
import { cookies } from "next/headers";
import styles from "./maurilio-fallback.module.css";
import AccessRecoveryClient from "./AccessRecoveryClient";
import {
  invokeMaurilioAccess,
  type AccessLibrary as AccessLibraryData,
  validSubjectId,
} from "@/lib/maurilio-access-server";
import { artDateTime } from "./maurilio-data";

export default async function AccessLibrary() {
  const store = await cookies();
  const subjectId = store.get("maurilio_sid")?.value;

  let reports: AccessLibraryData["reports"] = [];
  if (validSubjectId(subjectId)) {
    const result = await invokeMaurilioAccess<AccessLibraryData>({
      action: "library",
      subjectId,
    });
    if (result.ok) reports = result.data.reports;
  }

  return (
    <section className={styles.subview}>
      <div className={styles.subviewHero}>
        <span>ENTITLEMENT LIBRARY / PRIVATE ACCESS</span>
        <h1>Mis informes.</h1>
        <p>
          Los informes premium acreditados quedan asociados a este acceso y
          pueden revisarse después del Matchday. No usamos email ni datos
          personales para identificarte.
        </p>
      </div>

      <div className={styles.accessSummary}>
        <article>
          <span>ACCESO</span>
          <b>{validSubjectId(subjectId) ? "LOCAL VERIFIED" : "NO ACCESS COOKIE"}</b>
        </article>
        <article>
          <span>INFORMES ACTIVOS</span>
          <b>{String(reports.length)}</b>
        </article>
      </div>

      {reports.length === 0 ? (
        <div className={styles.emptyLedger}>
          <span>NO VERIFIED REPORTS</span>
          <h2>No hay informes premium en este acceso.</h2>
          <p>
            Si ya habías comprado desde otro navegador, recuperá el acceso con
            tu Recovery Code. Si todavía no compraste, los lockers del Matchday
            indicarán cuándo exista un informe disponible.
          </p>
          <Link className={styles.inlineAction} href="/maurilio">
            Volver al Matchday →
          </Link>
        </div>
      ) : (
        <div className={styles.accessReportList}>
          {reports.map((report) => {
            const params = new URLSearchParams({
              tier: report.tier,
              matchday: report.matchday,
            });

            return (
              <article className={styles.accessReportCard} key={report.id}>
                <div>
                  <span>{report.tier.toUpperCase()} / ACCESS VERIFIED</span>
                  <h2>{report.label}</h2>
                  <p>
                    {report.status.toUpperCase()} · acceso{" "}
                    {artDateTime(report.grantedAt)}
                  </p>
                </div>
                <Link
                  className={styles.reportOpen}
                  href={`/maurilio/informe?${params.toString()}`}
                >
                  Abrir informe →
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <AccessRecoveryClient hasAccess={reports.length > 0} />
    </section>
  );
}
