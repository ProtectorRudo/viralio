import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import styles from "./maurilio-fallback.module.css";
import AccessLibrary from "./AccessLibrary";
import DemoExperience from "./DemoExperience";
import FreeReveal from "./FreeReveal";
import IntegrityView from "./IntegrityView";
import PremiumCheckoutButton from "./PremiumCheckoutButton";
import PremiumReportView from "./PremiumReportView";
import PaymentReturnView from "./PaymentReturnView";
import PublicLedger from "./PublicLedger";
import TipsterMarketplace from "./TipsterMarketplace";
import TipsterProfile from "./TipsterProfile";
import {
  ars,
  fetchMaurilioGateway,
  pct,
  type PublicState,
} from "./maurilio-data";
import {
  fetchTipsterProfile,
  fetchTipsters,
} from "./tipsters-data";
import {
  invokeMaurilioAccess,
  type AccessStatus,
  validSubjectId,
} from "@/lib/maurilio-access-server";

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

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function HeaderNav() {
  return (
    <header className={styles.headerRow}>
      <Link
        className={styles.header}
        href="/maurilio"
        aria-label="Maurilio Matchday"
      >
        <div className={styles.mark}>M</div>
        <div>
          <b>MAURILIO</b>
          <span>QUANT FOOTBALL</span>
        </div>
      </Link>

      <nav className={styles.maurilioNav} aria-label="Maurilio">
        <Link href="/maurilio/tipsters">Tipsters</Link>
        <Link href="/maurilio">Matchday</Link>
        <Link href="/maurilio/mis-informes">Mis informes</Link>
        <Link href="/maurilio/registro">Registro</Link>
      </nav>
    </header>
  );
}

function SubviewShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell}>
      <div className={styles.pitch} aria-hidden="true" />
      <div className={styles.stadiumLights} aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>
      <section className={styles.panel}>
        <HeaderNav />
        {children}
      </section>
    </main>
  );
}

export default async function MaurilioPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolved, query] = await Promise.all([params, searchParams]);
  const view = resolved.path?.[0]?.toLowerCase() ?? "matchday";

  const ledgerView = view === "registro" || view === "archive";
  const integrityView = view === "integridad" || view === "integrity";
  const accessView = view === "mis-informes" || view === "access";
  const reportView = view === "informe" || view === "report";
  const demoView = view === "demo" || view === "experiencia";
  const paymentView = view === "pago" || view === "payment";
  const tipstersView = view === "tipsters" || view === "explorar";

  if (tipstersView) {
    const slug = resolved.path?.[1]?.toLowerCase();

    if (slug) {
      const profile = await fetchTipsterProfile(slug);

      return (
        <SubviewShell>
          {profile ? (
            <TipsterProfile data={profile} />
          ) : (
            <section className={styles.subview}>
              <div className={styles.tipsterEmpty}>
                <b>Tipster no encontrado.</b>
                <p>Puede haber cambiado de nombre o no estar publicado.</p>
                <Link className={styles.inlineAction} href="/maurilio/tipsters">
                  Volver a buscar →
                </Link>
              </div>
            </section>
          )}
        </SubviewShell>
      );
    }

    const marketplace = await fetchTipsters();

    return (
      <SubviewShell>
        {marketplace ? (
          <TipsterMarketplace data={marketplace} />
        ) : (
          <section className={styles.subview}>
            <div className={styles.tipsterEmpty}>
              <b>No pudimos cargar los tipsters.</b>
              <p>Probá nuevamente en unos segundos.</p>
            </div>
          </section>
        )}
      </SubviewShell>
    );
  }

  if (ledgerView) {
    return (
      <SubviewShell>
        <PublicLedger />
      </SubviewShell>
    );
  }

  if (integrityView) {
    return (
      <SubviewShell>
        <IntegrityView />
      </SubviewShell>
    );
  }

  if (accessView) {
    return (
      <SubviewShell>
        <AccessLibrary />
      </SubviewShell>
    );
  }

  if (demoView) {
    return (
      <SubviewShell>
        <DemoExperience />
      </SubviewShell>
    );
  }

  if (paymentView) {
    const paymentState = resolved.path?.[1]?.toLowerCase();
    const validState =
      paymentState === "success" ||
      paymentState === "pending" ||
      paymentState === "failure"
        ? paymentState
        : "failure";

    return (
      <SubviewShell>
        <PaymentReturnView
          state={validState}
          tier={first(query.tier)}
        />
      </SubviewShell>
    );
  }

  if (reportView) {
    return (
      <SubviewShell>
        <PremiumReportView
          tier={first(query.tier)}
          matchday={first(query.matchday)}
        />
      </SubviewShell>
    );
  }

  const store = await cookies();
  const subjectId = store.get("maurilio_sid")?.value;

  const stateRequest = fetchMaurilioGateway<PublicState>("state");
  const accessRequest = validSubjectId(subjectId)
    ? invokeMaurilioAccess<AccessStatus>({
        action: "status",
        subjectId,
      })
    : Promise.resolve(null);

  const [state, accessResult] = await Promise.all([
    stateRequest,
    accessRequest,
  ]);

  const access =
    accessResult && accessResult.ok ? accessResult.data : null;

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

  const activeSlug = state?.matchday?.slug ?? null;
  const proAvailable = Boolean(state?.mode === "matchday" && state.premium.pro);
  const eliteAvailable = Boolean(
    state?.mode === "matchday" && state.premium.elite,
  );
  const proUnlocked = Boolean(proAvailable && access?.pro);
  const eliteUnlocked = Boolean(eliteAvailable && access?.elite);

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
          <small>
            {access?.activeEntitlements
              ? `${access.activeEntitlements} ACCESS · `
              : ""}
            viralio.net/maurilio
          </small>
        </div>

        <div className={styles.hero}>
          <span>
            {mode === "matchday"
              ? "MATCHDAY / LIVE MODEL"
              : "SYSTEM STATUS / MARKET"}
          </span>
          <h1 className={styles.liveHeadline}>{headline}</h1>
          <p>{description}</p>
          <div className={styles.heroDemoCta}>
            <Link href="/maurilio/demo">Vivir la experiencia demo →</Link>
            <span>PENAL → ANÁLISIS</span>
          </div>
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
                ? "Cada locker cambia de estado únicamente cuando existe una señal real publicada y el acceso premium se valida en servidor."
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

            <article className={proUnlocked ? styles.lockerUnlocked : undefined}>
              <div className={styles.jersey}><small>M</small><b>PRO</b></div>
              <span>02 / VAR AUDIT</span>
              <strong>
                {proUnlocked
                  ? "ABRIR INFORME"
                  : proAvailable
                    ? "DISPONIBLE"
                    : "SELLADO"}
              </strong>
              <p>Convicción media, precio mínimo y auditoría ampliada.</p>
              {proUnlocked && activeSlug ? (
                <Link
                  className={styles.lockerAction}
                  href={`/maurilio/informe?tier=pro&matchday=${encodeURIComponent(activeSlug)}`}
                >
                  Abrir informe verificado →
                </Link>
              ) : proAvailable ? (
                <PremiumCheckoutButton tier="pro" />
              ) : null}
            </article>

            <article
              className={
                eliteUnlocked
                  ? `${styles.lockerElite} ${styles.lockerUnlocked}`
                  : styles.lockerElite
              }
            >
              <div className={styles.jersey}><small>M</small><b>ELITE</b></div>
              <span>03 / THE LOCKER</span>
              <strong>
                {eliteUnlocked
                  ? "ABRIR INFORME"
                  : eliteAvailable
                    ? "HIGH CONVICTION"
                    : "SELLADO"}
              </strong>
              <p>
                Reservado para discrepancias excepcionales. Nunca se fuerza.
              </p>
              {eliteUnlocked && activeSlug ? (
                <Link
                  className={styles.lockerAction}
                  href={`/maurilio/informe?tier=elite&matchday=${encodeURIComponent(activeSlug)}`}
                >
                  Abrir informe verificado →
                </Link>
              ) : eliteAvailable ? (
                <PremiumCheckoutButton tier="elite" />
              ) : null}
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
