import type { Metadata } from "next";
import Link from "next/link";
import styles from "./maurilio-fallback.module.css";
import AuthView from "./AuthView";
import TipsterMarketplace from "./TipsterMarketplace";
import TipsterStudio from "./TipsterStudio";
import TipsterProfile from "./TipsterProfile";
import {
  fetchTipsterProfile,
  fetchTipsters,
} from "./tipsters-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maurilio · Tipsters verificados",
  description:
    "Encontrá tipsters, revisá su historial registrado y suscribite para acceder a sus próximos tips.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

function HeaderNav() {
  return (
    <header className={styles.headerRow}>
      <Link
        className={styles.header}
        href="/maurilio"
        aria-label="Maurilio"
      >
        <div className={styles.mark}>M</div>
        <div>
          <b>MAURILIO</b>
          <span>TIPSTERS VERIFICADOS</span>
        </div>
      </Link>

      <nav className={styles.maurilioNav} aria-label="Maurilio">
        <Link href="/maurilio">Explorar</Link>
        <Link href="/maurilio/suscripciones">Mis suscripciones</Link>
        <Link href="/maurilio/para-tipsters">Soy tipster</Link>
        <Link href="/maurilio/ingresar">Ingresar</Link>
      </nav>
    </header>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell}>
      <div className={styles.pitch} aria-hidden="true" />
      <section className={styles.panel}>
        <HeaderNav />
        {children}
      </section>
    </main>
  );
}

function ComingSoon({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={styles.simpleProductPage}>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
      {action}
    </section>
  );
}

export default async function MaurilioPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const resolved = await params;
  const path = resolved.path ?? [];
  const view = path[0]?.toLowerCase() ?? "explorar";

  const legacyViews = new Set([
    "demo",
    "integridad",
    "integrity",
    "registro",
    "archive",
    "matchday",
    "mis-informes",
    "access",
    "informe",
    "report",
    "pago",
    "payment",
  ]);

  if (legacyViews.has(view)) {
    const marketplace = await fetchTipsters();

    return (
      <Shell>
        {marketplace ? (
          <TipsterMarketplace data={marketplace} />
        ) : (
          <ComingSoon
            eyebrow="MARKETPLACE"
            title="Estamos cargando los tipsters."
            copy="Probá nuevamente en unos segundos."
          />
        )}
      </Shell>
    );
  }

  if (view === "tipsters" || view === "explorar") {
    const slug = view === "tipsters" ? path[1]?.toLowerCase() : undefined;

    if (slug) {
      const profile = await fetchTipsterProfile(slug);

      return (
        <Shell>
          {profile ? (
            <TipsterProfile data={profile} />
          ) : (
            <ComingSoon
              eyebrow="PERFIL"
              title="Tipster no encontrado."
              copy="Puede no estar publicado o haber cambiado de nombre."
              action={
                <Link className={styles.inlineAction} href="/maurilio">
                  Volver a explorar →
                </Link>
              }
            />
          )}
        </Shell>
      );
    }

    const marketplace = await fetchTipsters();

    return (
      <Shell>
        {marketplace ? (
          <TipsterMarketplace data={marketplace} />
        ) : (
          <ComingSoon
            eyebrow="MARKETPLACE"
            title="No pudimos cargar los tipsters."
            copy="Probá nuevamente en unos segundos."
          />
        )}
      </Shell>
    );
  }

  if (view === "suscripciones") {
    return (
      <Shell>
        <ComingSoon
          eyebrow="MI CUENTA"
          title="Tus tipsters, en un solo lugar."
          copy="Acá van a aparecer las suscripciones activas, próximas renovaciones y los tips futuros que tengas desbloqueados."
          action={
            <Link className={styles.productPrimaryLink} href="/maurilio/ingresar">
              Ingresar →
            </Link>
          }
        />
      </Shell>
    );
  }

  if (view === "para-tipsters") {
    return (
      <Shell>
        <TipsterStudio />
      </Shell>
    );
  }

  if (view === "ingresar" || view === "registro") {
    return (
      <Shell>
        <AuthView />
      </Shell>
    );
  }

  const marketplace = await fetchTipsters();
  return (
    <Shell>
      {marketplace ? (
        <TipsterMarketplace data={marketplace} />
      ) : (
        <ComingSoon
          eyebrow="MAURILIO"
          title="Marketplace de tipsters."
          copy="Volvé a intentar en unos segundos."
        />
      )}
    </Shell>
  );
}
