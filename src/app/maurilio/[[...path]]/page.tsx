import type { Metadata } from "next";
import styles from "./maurilio-fallback.module.css";
import FreeReveal from "./FreeReveal";
import IntegrityView from "./IntegrityView";
import PublicLedger from "./PublicLedger";
import {
  ars,
  fetchMaurilioGateway,
  pct,
  type PublicState,
} from "./maurilio-data";

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

function HeaderNav() {
  return (
    <header className={styles.headerRow}>
      <a className={styles.header} href="/maurilio" aria-label="Maurilio Matchday">
        <div className={styles.mark}>M</div>
        <div>
          <b>MAURILIO</b>
          <span>QUANT FOOTBALL</span>
        </div>
      </a>

      <nav className={styles.maurilioNav} aria-label="Maurilio">
        <a href="/maurilio">Matchday</a>
        <a href="/maurilio/integridad">Integridad</a>
        <a href="/maurilio/registro">Registro</a>
      </nav>
    </header>
  );
}

export default async function MaurilioPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const resolved = await params;
  const view = resolved.path?.[0]?.toLowerCase() ?? "matchday";

  const ledgerView = view === "registro" || view === "archive";
  const integrityView = view === "integridad" || view === "integrity";

  if (ledgerView || integrityView) {
    return (
      <main className={styles.shell}>
        <div className={styles.pitch} aria-hidden="true" />
        <div className={styles.stadiumLights} aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
        </div>
        <section className={styles.panel}>
          <HeaderNav />
          {ledgerView ? <PublicLedger /> : <IntegrityView />}
        </section>
      </main>
    );
  }

  const state = await fetchMaurilioGateway<PublicState>("state");
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
          ? "Matchday publicado. La selección FREE se expone abajo; PRO y ELITE permanecen protegidos."
          : "No hay un Matchday publicado en este momento. Maurilio no fuerza una apuesta cuando no existe una discrepancia de precio suficiente.";

  return (
    <main className={styles.shell}>
      <div className={styles.pitch} aria-hidden="true" />
      <div className={styles.stadiumLights} aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>

      <section className={styles.panel}>
        <HeaderNav />

        <div className={styles.status}>
          <span className={styles.dot} />
          <b>{state ? state.status : "SAFE FALLBACK"}</b>
          <small>viralio.net/maurilio</small>
        </div>

        <div className={styles.hero}>
          <span>
            {mode === "matchday"
              ? "MATCHDAY / LIVE MODEL"
              : "SYSTEM STATUS / MARKET"}
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
            <span>P&amp;L</span>
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

        <section className={styles.lockerSection}>
          <div className={styles.lockerSectionHead}>
            <div>
              <span>EL VESTUARIO</span>
              <h2>
                {state?.mode === "matchday"
                  ? "Accesos del Matchday."
                  : "Hoy no hay nada que revelar."}
              </h2>
            </div>
            <p>
              {state?.mode === "matchday"
                ? "Cada locker cambia de estado únicamente cuando existe una señal real publicada."
                : "Los lockers permanecen cerrados hasta que una señal supere precio mínimo, EV robusto y auditoría adversarial."}
            </p>
          </div>

          <div className={styles.lockerGrid}>
            <article className={styles.lockerFree}>
              <div className={styles.jersey}><small>M</small><b>FREE</b></div>
              <span>01 / OPEN ANALYSIS</span>
              <strong>
                {state?.mode === "matchday" && state.free
                  ? "REVELAR"
                  : "SIN SEÑAL"}
              </strong>
              <p>
                Lectura abierta. El proceso se muestra antes de revelar la
                selección.
              </p>
              {state?.mode === "matchday" && state.free ? (
                <a className={styles.lockerAction} href="#free-reveal">
                  Abrir auditoría →
                </a>
              ) : null}
            </article>

            <article>
              <div className={styles.jersey}><small>M</small><b>PRO</b></div>
              <span>02 / VAR AUDIT</span>
              <strong>
                {state?.mode === "matchday" && state.premium.pro
                  ? "DISPONIBLE"
                  : "SELLADO"}
              </strong>
              <p>Convicción media, precio mínimo y auditoría ampliada.</p>
            </article>

            <article className={styles.lockerElite}>
              <div className={styles.jersey}><small>M</small><b>ELITE</b></div>
              <span>03 / THE LOCKER</span>
              <strong>
                {state?.mode === "matchday" && state.premium.elite
                  ? "HIGH CONVICTION"
                  : "SELLADO"}
              </strong>
              <p>
                Reservado para discrepancias excepcionales. Nunca se fuerza.
              </p>
            </article>
          </div>
        </section>

        {state?.mode === "matchday" && state.free ? (
          <FreeReveal pick={state.free} />
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
