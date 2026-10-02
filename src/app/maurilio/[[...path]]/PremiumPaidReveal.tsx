"use client";

import { useState } from "react";
import styles from "./maurilio-fallback.module.css";
import type { PremiumReport } from "@/lib/maurilio-access-server";

type Tier = "pro" | "elite";
type Phase = "ready" | "kicking" | "revealed" | "error";

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pct(value: unknown, digits = 1, signed = false) {
  const parsed = number(value);
  if (parsed === null) return "—";
  const prefix = signed && parsed >= 0 ? "+" : "";
  return `${prefix}${(parsed * 100).toFixed(digits)}%`;
}

function odds(value: unknown) {
  const parsed = number(value);
  return parsed === null ? "—" : `@${parsed.toFixed(2)}`;
}

function ars(value: unknown) {
  const parsed = number(value);
  if (parsed === null) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(parsed);
}

function artDateTime(value: unknown) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return (
    new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date) + " ART"
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function PremiumPaidReveal({
  tier,
  matchday,
}: {
  tier: Tier;
  matchday: string;
}) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [report, setReport] = useState<PremiumReport | null>(null);

  async function kick() {
    if (phase === "kicking") return;
    setPhase("kicking");
    setReport(null);

    try {
      const [response] = await Promise.all([
        fetch(
          `/maurilio/api/premium/${tier}?matchday=${encodeURIComponent(matchday)}`,
          { cache: "no-store" },
        ),
        wait(900),
      ]);

      if (!response.ok) throw new Error("premium_fetch_failed");
      const body = (await response.json()) as PremiumReport;
      setReport(body);
      setPhase("revealed");
    } catch {
      setPhase("error");
    }
  }

  if (phase !== "revealed" || !report) {
    return (
      <section className={styles.paidReveal}>
        <div className={styles.paidRevealHead}>
          <div>
            <span>ACCESS VERIFIED</span>
            <b>{tier.toUpperCase()} · INFORME DESBLOQUEADO</b>
          </div>
          <small>El análisis todavía no fue enviado a esta pantalla.</small>
        </div>

        <div className={styles.simplePenalty}>
          <div className={styles.simpleGoal} aria-hidden="true">
            <div className={styles.simpleNet} />
            <span className={styles.simpleKeeper}>M</span>
            <span
              className={
                phase === "kicking"
                  ? `${styles.simpleBall} ${styles.simpleBallKicking}`
                  : styles.simpleBall
              }
            >
              ⚽
            </span>
            <span
              className={
                phase === "kicking"
                  ? `${styles.simpleGoalFlash} ${styles.simpleGoalFlashActive}`
                  : styles.simpleGoalFlash
              }
            />
          </div>

          <button
            type="button"
            className={styles.simpleKickButton}
            onClick={kick}
            disabled={phase === "kicking"}
          >
            <b>
              {phase === "kicking"
                ? "PATEANDO…"
                : phase === "error"
                  ? "REINTENTAR PENAL"
                  : "PATEAR PENAL"}
            </b>
            <span>
              {phase === "error"
                ? "No pudimos cargar el informe. Tu acceso sigue intacto."
                : "Revelar análisis comprado"}
            </span>
          </button>
        </div>
      </section>
    );
  }

  const low = number(report.probability_low);
  const high = number(report.probability_high);
  const entry = number(report.entry_odds);
  const floorEv =
    low !== null && entry !== null ? low * entry - 1 : null;

  return (
    <section className={styles.paidReveal}>
      <div className={styles.premiumVerified}>
        <div className={styles.premiumVerifiedHead}>
          <div>
            <span>ANÁLISIS REVELADO</span>
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
            {report.selection ? (
              <strong>{String(report.selection)}</strong>
            ) : null}
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
          <div>
            <span>RANGO</span>
            <b>
              {low !== null && high !== null
                ? `${pct(low)} — ${pct(high)}`
                : "—"}
            </b>
          </div>
          <div><span>EDGE</span><b>{pct(report.edge, 1, true)}</b></div>
          <div><span>EV</span><b>{pct(report.ev, 1, true)}</b></div>
          <div>
            <span>EV PISO</span>
            <b>{floorEv === null ? "—" : pct(floorEv, 1, true)}</b>
          </div>
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
          <div>
            <span>CAPTURA BET365</span>
            <b>{artDateTime(report.odds_captured_at)}</b>
          </div>
          <div>
            <span>INICIO EVENTO</span>
            <b>{artDateTime(report.event_start_at)}</b>
          </div>
          <div>
            <span>ESTADO</span>
            <b>
              {String(
                report.sale_status ?? report.result ?? "—",
              ).toUpperCase()}
            </b>
          </div>
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
