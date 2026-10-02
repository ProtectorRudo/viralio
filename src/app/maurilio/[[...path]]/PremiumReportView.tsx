import Link from "next/link";
import { cookies } from "next/headers";
import styles from "./maurilio-fallback.module.css";
import {
  invokeMaurilioAccess,
  type AccessTier,
  type PremiumReport,
  validSubjectId,
} from "@/lib/maurilio-access-server";
import { ars, artDateTime, odds, pct } from "./maurilio-data";

function unavailable(reason: "access" | "report") {
  return (
    <section className={styles.subview}>
      <div className={styles.emptyLedger}>
        <span>{reason === "access" ? "ACCESS REQUIRED" : "REPORT UNAVAILABLE"}</span>
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

  const store = await cookies();
  const subjectId = store.get("maurilio_sid")?.value;
  if (!validSubjectId(subjectId)) return unavailable("access");

  const result = await invokeMaurilioAccess<{ report: PremiumReport }>({
    action: "report",
    subjectId,
    tier: tier as AccessTier,
    ...(matchday ? { matchday } : {}),
  });

  if (!result.ok) {
    return unavailable(result.status === 403 ? "access" : "report");
  }

  const report = result.data.report;
  const low = Number(report.probability_low);
  const high = Number(report.probability_high);
  const entry = Number(report.entry_odds);
  const floorEv =
    Number.isFinite(low) && Number.isFinite(entry) ? low * entry - 1 : null;

  return (
    <section className={styles.subview}>
      <div className={styles.premiumVerified}>
        <div className={styles.premiumVerifiedHead}>
          <div>
            <span>{tier === "elite" ? "THE LOCKER" : "VAR AUDIT"}</span>
            <b>ACCESS VERIFIED · {String(report.access_tag ?? "—")}</b>
          </div>
          <strong>{tier.toUpperCase()}</strong>
        </div>

        <small>{String(report.competition ?? "—")}</small>
        <h1>{String(report.event ?? "—")}</h1>

        <div className={styles.premiumMarket}>
          <div>
            <span>MERCADO</span>
            <b>{String(report.market ?? "—")}</b>
            {report.selection ? <strong>{String(report.selection)}</strong> : null}
          </div>
          <div>
            <span>BET365</span>
            <b>{odds(report.entry_odds)}</b>
          </div>
        </div>

        <div className={styles.premiumMetrics}>
          <div><span>CUOTA MÍNIMA</span><b>{odds(report.minimum_odds)}</b></div>
          <div><span>IMPLÍCITA</span><b>{pct(report.implied_probability)}</b></div>
          <div><span>NUESTRO MODELO</span><b>{pct(report.probability_own)}</b></div>
          <div><span>RANGO</span><b>{Number.isFinite(low) && Number.isFinite(high) ? `${pct(low)} — ${pct(high)}` : "—"}</b></div>
          <div><span>EDGE</span><b>{pct(report.edge, 1, true)}</b></div>
          <div><span>EV</span><b>{pct(report.ev, 1, true)}</b></div>
          <div><span>EV PISO</span><b>{floorEv === null ? "—" : pct(floorEv, 1, true)}</b></div>
          <div><span>STAKE</span><b>{pct(report.stake_pct)}</b></div>
          <div><span>STAKE ARS</span><b>{ars(report.stake_ars)}</b></div>
        </div>

        <div className={styles.thesisGrid}>
          <article>
            <span>TESIS</span>
            <p>{String(report.thesis ?? "—")}</p>
          </article>
          <article>
            <span>MEJOR RAZÓN PARA NO ENTRAR</span>
            <p>{String(report.principal_risk ?? "—")}</p>
          </article>
        </div>

        <div className={styles.premiumProofGrid}>
          <div><span>ID</span><b>{String(report.public_id ?? "—")}</b></div>
          <div><span>CAPTURA BET365</span><b>{artDateTime(report.odds_captured_at)}</b></div>
          <div><span>INICIO EVENTO</span><b>{artDateTime(report.event_start_at)}</b></div>
          <div><span>ESTADO</span><b>{String(report.sale_status ?? report.result ?? "—").toUpperCase()}</b></div>
        </div>

        {report.result ? (
          <div className={styles.settledProof}>
            <span>SETTLED</span>
            <b>{String(report.result).toUpperCase()}</b>
            <small>
              Cierre {odds(report.closing_odds)} · P&amp;L {ars(report.pnl_ars)}
            </small>
          </div>
        ) : null}
      </div>
    </section>
  );
}
