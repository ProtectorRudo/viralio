import type { Metadata } from "next";
import styles from "./maurilio-fallback.module.css";

export const metadata: Metadata = {
  title: "Maurilio · Acceso temporal",
  description: "Estado de activación de Maurilio dentro de Viralio.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function MaurilioFallback({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  await params;

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
          <b>ROUTE ONLINE</b>
          <small>viralio.net/maurilio</small>
        </div>

        <div className={styles.hero}>
          <span>SYSTEM STATUS / MATCHDAY</span>
          <h1>
            Acceso temporalmente
            <em> en activación.</em>
          </h1>
          <p>
            Viralio ya reconoce la ruta de Maurilio. El entorno seguro que sirve
            el Matchday, los informes y el acceso privado todavía no está
            conectado a producción.
          </p>
        </div>

        <div className={styles.grid}>
          <article>
            <span>01</span>
            <b>DOMAIN</b>
            <strong>ONLINE</strong>
          </article>
          <article>
            <span>02</span>
            <b>ROUTE</b>
            <strong>READY</strong>
          </article>
          <article>
            <span>03</span>
            <b>MAURILIO ORIGIN</b>
            <strong>PENDING</strong>
          </article>
        </div>

        <footer className={styles.footer}>
          <span>NO DEMO DATA · NO UNVERIFIED ODDS</span>
          <p>
            Cuando el origin de Maurilio quede conectado, esta pantalla se
            reemplazará automáticamente por la experiencia completa.
          </p>
        </footer>
      </section>
    </main>
  );
}
