import type { Metadata } from "next";
import { ReaderActions } from "./ReaderActions";
import { readerBlocks } from "./reader-data";

export const metadata: Metadata = {
  title: "ANUNCIOS QUE VENDEN | Tu Playbook",
  description: "Acceso al Playbook ANUNCIOS QUE VENDEN.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

function Callout({ text }: { text: string }) {
  const [title, ...rest] = text.split("\n");
  return (
    <aside className="reader-callout">
      <strong>{title}</strong>
      {rest.length ? <p>{rest.join("\n")}</p> : null}
    </aside>
  );
}

export default function EbookDownloadPage() {
  return (
    <main className="reader-page">
      <link rel="stylesheet" href="/ebook/reader.css" />

      <header className="reader-hero">
        <div className="reader-hero-grid" />
        <div className="reader-hero-inner">
          <div className="reader-badge">✓ ACCESO AL PRODUCTO</div>
          <p className="reader-overline">ANUNCIOS QUE VENDEN · PLAYBOOK 2026</p>
          <h1>Tu sistema para crear anuncios con más potencial de captar atención y vender.</h1>
          <p className="reader-lead">
            Ya tenés acceso. Guardá este enlace. Abajo está el Playbook completo con
            <strong> 100 hooks, 30 estructuras, 20 guiones, prompts de IA, diagnóstico y checklist.</strong>
          </p>

          <div className="reader-value-row">
            <div><strong>100</strong><span>HOOKS</span></div>
            <div><strong>30</strong><span>ESTRUCTURAS</span></div>
            <div><strong>20</strong><span>GUIONES</span></div>
            <div><strong>A.R.D.A.</strong><span>MÉTODO</span></div>
          </div>

          <ReaderActions />

          <p className="reader-private-note">
            Este enlace funciona como tu acceso al producto. Te recomendamos guardarlo en favoritos y no compartirlo.
          </p>
        </div>
      </header>

      <nav className="reader-nav" aria-label="Contenido del playbook">
        <a href="#playbook">EMPEZAR A LEER ↓</a>
        <span>ATENCIÓN</span>
        <span>RETENCIÓN</span>
        <span>DESEO</span>
        <span>ACCIÓN</span>
      </nav>

      <article className="reader-content" id="playbook">
        {readerBlocks.map((block, index) => {
          const key = block.type + "-" + index;

          if (block.type === "kicker") {
            return <div className="reader-kicker" key={key}>{block.text}</div>;
          }

          if (block.type === "h1") {
            return <h2 className="reader-h1" key={key}>{block.text}</h2>;
          }

          if (block.type === "h2") {
            return <h3 className="reader-h2" key={key}>{block.text}</h3>;
          }

          if (block.type === "p") {
            return <p className="reader-p" key={key}>{block.text}</p>;
          }

          if (block.type === "strong") {
            return <p className="reader-strong" key={key}>{block.text}</p>;
          }

          if (block.type === "callout") {
            return <Callout text={block.text} key={key} />;
          }

          if (block.type === "bullet") {
            return (
              <div className="reader-bullet" key={key}>
                <span>✓</span>
                <p>{block.text}</p>
              </div>
            );
          }

          return (
            <div className="reader-table-wrap" key={key}>
              <table>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        <section className="reader-finish">
          <span>FIN DEL PLAYBOOK</span>
          <h2>Ahora no necesitás otra idea.<br />Necesitás producir la próxima variante.</h2>
          <p>Volvé a este Playbook cada vez que tengas que crear, diagnosticar o mejorar un anuncio.</p>
          <ReaderActions />
        </section>
      </article>

      <footer className="reader-footer">
        <strong>ANUNCIOS QUE VENDEN™</strong>
        <span>Producto digital de Viralio · 2026</span>
      </footer>
    </main>
  );
}
