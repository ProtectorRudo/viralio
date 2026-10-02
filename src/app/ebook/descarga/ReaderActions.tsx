"use client";

export function ReaderActions() {
  return (
    <div className="reader-actions">
      <button type="button" onClick={() => window.print()}>
        GUARDAR / IMPRIMIR PDF
        <span>↓</span>
      </button>
      <button type="button" className="reader-action-secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        VOLVER ARRIBA
        <span>↑</span>
      </button>
    </div>
  );
}
