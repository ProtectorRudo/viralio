import type { Metadata } from "next";
import styles from "./maurilio-fallback.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maurilio · Quant Football",
  description:
    "Auditoría cuantitativa de mercados deportivos. Compramos probabilidades, no certezas.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

const STATE_URL =
  "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/maurilio-public-state";

// Legacy anon JWT: intentionally public, equivalent to a publishable browser key.
// Edge Function verification rejects requests without a valid project JWT.
const PUBLIC_SUPABASE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2d4cHR0bnJjdGtscmNqbWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUwMTIsImV4cCI6MjEwMzk1MTAxMn0.XNmGhD52sJlNSkPip41moM8Z6YesrYmx7AGrBK0KZII";

type PublicState = {
  mode: "off_market" | "no_value" | "matchday";
  status: string;
  label: string;
  matchday: {
    slug: string;
    matchDate: string;
    publishedAt: string | null;
  } | null;
  free: Record<string, unknown> | null;
  premium: {
    pro: boolean;
    elite: boolean;
  };
  risk: Record<string, unknown> | null;
  updatedAt: string;
};

async function getPublicState(): Promise<PublicState | null> {
  try {
    const response = await fetch(STATE_URL, {
      headers: {
        Authorization: `Bearer ${PUBLIC_SUPABASE_JWT}`,
        apikey: PUBLIC_SUPABASE_JWT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) return null;

    const body = (await response.json()) as PublicState;
    if (
      body.mode !== "off_market" &&
      body.mode !== "no_value" &&
      body.mode !== "matchday"
    ) {
      return null;
    }

    return body;
  } catch {
    return null;
  }
}

function numeric(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pct(value: unknown, digits = 1) {
  const number = numeric(value);
  return number === null ? "—" : `${(number * 100).toFixed(digits)}%`;
}

function odds(value: unknown) {
  const number = numeric(value);
  return number === null ? "—" : `@${number.toFixed(2)}`;
}

function ars(value: unknown) {
  const number = numeric(value);
  return number === null
    ? "—"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(number);
}

function freeMetric(free: Record<string, unknown>, key: string) {
  return free[key];
}

export default async function MaurilioPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  await params;
  const state = await getPublicState();

  const mode = state?.mode ?? "off_market";
  const risk = state?.risk ?? null;
  const bank = risk ? risk.bank_ars : null;
  const pnl = risk ? risk.pnl_ars : null;
  const roi = risk ? risk.roi : null;

  const headline =
    !state
      ? "Sistema online. Estado de mercado no disponible."
      : mode === "no_value"
        ? "HOY NO HAY APUESTA CON SUFICIENTE VALOR"
        : mode === "matchday"
          ? state.label
          : "Mercado abierto. Sin señal aprobada.";

  const description =
    !state
      ? "La ruta está operativa, pero el estado cuantitativo no pudo verificarse en este momento. No mostramos datos parciales ni inventados."
      : mode === "no_value"
        ? "La jornada fue auditada y ninguna entrada superó el umbral de valor exigido por el modelo."
        : mode === "matchday"
          ? "Matchday publicado. La selección FREE se expone abajo; PRO y ELITE permanecen protegidos por entitlement."
          : "No hay un Matchday publicado en este momento. Maurilio no fuerza una apuesta cuando no existe una discrepancia de precio suficiente.";

  return (
    <main className={styles.shell}>
      <div className={styles.pitch} aria-hidden="true" />
      <section className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.mark}>M</div>
          <div>
            <b>MAURILIO</b>
            <span>QUANT FOOTBALL</span>
          </div>
        </header>

        <div className={styles.status}>
          <span className={styles.dot} />
          <b>{state ? state.status : "SAFE FALLBACK"}</b>
          <small>viralio.net/maurilio</small>
        </div>

        <div className={styles.hero}>
          <span>
            {mode === "matchday" ? "MATCHDAY / LIVE MODEL" : "SYSTEM STATUS / MARKET"}
          </span>
          <h1 className={styles.liveHeadline}>{headline}</h1>
          <p>{description}</p>
        </div>

        <div className={styles.metrics}>
          <article>
            <span>BANCA</span>
            <strong>{ars(bank)}</strong>
          </article>
          <article>
            <span>P&L</span>
            <strong>{ars(pnl)}</strong>
          </article>
          <article>
            <span>ROI</span>
            <strong>{roi === null ? "—" : pct(roi)}</strong>
          </article>
          <article>
            <span>FUENTE DE PRECIO</span>
            <strong>BET365 ONLY</strong>
          </article>
        </div>

        {state?.mode === "matchday" && state.free ? (
          <section className={styles.freeCard}>
            <div className={styles.freeTop}>
              <div>
                <span>FREE / ACCESO LIBRE</span>
                <h2>{String(freeMetric(state.free, "event") ?? "Evento")}</h2>
              </div>
              <b>{String(freeMetric(state.free, "public_id") ?? "FREE")}</b>
            </div>

            <div className={styles.marketBlock}>
              <small>MERCADO</small>
              <strong>{String(freeMetric(state.free, "market") ?? "—")}</strong>
              {freeMetric(state.free, "selection") ? (
                <b>{String(freeMetric(state.free, "selection"))}</b>
              ) : null}
            </div>

            <div className={styles.pickMetrics}>
              <div>
                <span>BET365</span>
                <b>{odds(freeMetric(state.free, "entry_odds"))}</b>
              </div>
              <div>
                <span>CUOTA MÍNIMA</span>
                <b>{odds(freeMetric(state.free, "minimum_odds"))}</b>
              </div>
              <div>
                <span>PROB. PROPIA</span>
                <b>{pct(freeMetric(state.free, "probability_own"))}</b>
              </div>
              <div>
                <span>STAKE</span>
                <b>{pct(freeMetric(state.free, "stake_pct"))}</b>
              </div>
            </div>

            <div className={styles.thesis}>
              <span>TESIS</span>
              <p>{String(freeMetric(state.free, "thesis") ?? "—")}</p>
            </div>
            <div className={styles.risk}>
              <span>MEJOR RAZÓN PARA NO ENTRAR</span>
              <p>{String(freeMetric(state.free, "principal_risk") ?? "—")}</p>
            </div>
          </section>
        ) : null}

        {state?.mode === "matchday" ? (
          <section className={styles.lockedGrid}>
            <article>
              <span>PRO</span>
              <b>{state.premium.pro ? "INFORME DISPONIBLE" : "SIN INFORME"}</b>
              <small>Stake medio · entitlement requerido</small>
            </article>
            <article>
              <span>ELITE</span>
              <b>{state.premium.elite ? "HIGH CONVICTION" : "SIN INFORME"}</b>
              <small>Stake fuerte · entitlement requerido</small>
            </article>
          </section>
        ) : null}

        <div className={styles.rules}>
          <article>
            <span>01</span>
            <b>NO CERTEZAS</b>
            <p>Buscamos discrepancias entre probabilidad estimada y precio.</p>
          </article>
          <article>
            <span>02</span>
            <b>CUOTA MÍNIMA</b>
            <p>Si Bet365 cae debajo del umbral, la entrada deja de ser válida.</p>
          </article>
          <article>
            <span>03</span>
            <b>RIESGO LIMITADO</b>
            <p>Máximo 2% por entrada y exposición simultánea controlada.</p>
          </article>
        </div>

        <footer className={styles.footer}>
          <span>
            {state
              ? `LIVE STATE · ${new Date(state.updatedAt).toLocaleString("es-AR", {
                  timeZone: "America/Argentina/Buenos_Aires",
                })}`
              : "LIVE STATE TEMPORARILY UNAVAILABLE"}
          </span>
          <p>
            No somos pronosticadores: somos compradores de probabilidades. Si el
            precio no ofrece valor suficiente, no apostamos.
          </p>
        </footer>
      </section>
    </main>
  );
}
