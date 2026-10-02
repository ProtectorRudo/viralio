import styles from "./maurilio-fallback.module.css";
import {
  ars,
  artDateTime,
  fetchMaurilioGateway,
  odds,
  pct,
  type LedgerState,
} from "./maurilio-data";

export default async function PublicLedger() {
  const data = await fetchMaurilioGateway<LedgerState>("ledger");
  const rows = data?.ledger ?? [];
  const risk = data?.risk ?? null;

  return (
    <section className={styles.subview}>
      <div className={styles.subviewHero}>
        <span>PUBLIC LEDGER / IMMUTABLE HISTORY</span>
        <h1>Registro real.</h1>
        <p>
          Ganar no convierte una mala compra en buena. Perder tampoco invalida
          automáticamente una decisión con valor. Acá quedan resultados, precio
          de entrada, cierre Bet365, stake y P&amp;L.
        </p>
      </div>

      <div className={styles.ledgerSummary}>
        <article><span>BANCA</span><b>{ars(risk?.bank_ars)}</b></article>
        <article><span>P&amp;L</span><b>{ars(risk?.pnl_ars)}</b></article>
        <article><span>ROI</span><b>{pct(risk?.roi)}</b></article>
        <article><span>LIQUIDADAS</span><b>{String(risk?.settled_count ?? 0)}</b></article>
      </div>

      {rows.length === 0 ? (
        <div className={styles.emptyLedger}>
          <span>NO SETTLED PICKS</span>
          <h2>Todavía no hay historial liquidado.</h2>
          <p>
            El registro empieza cuando una predicción publicada se liquida. No
            se fabrican ejemplos para llenar esta pantalla.
          </p>
        </div>
      ) : (
        <div className={styles.ledgerList}>
          {rows.map((row, index) => (
            <article className={styles.ledgerRow} key={String(row.public_id ?? index)}>
              <div className={styles.ledgerRowHead}>
                <div>
                  <span>{String(row.tier ?? "—").toUpperCase()}</span>
                  <b>{String(row.public_id ?? "—")}</b>
                </div>
                <strong>{String(row.result ?? "—").toUpperCase()}</strong>
              </div>

              <h3>{String(row.event ?? "—")}</h3>
              <p>{String(row.competition ?? "—")}</p>

              <div className={styles.ledgerMarket}>
                <span>MERCADO</span>
                <b>{String(row.market ?? "—")}</b>
                {row.selection ? <small>{String(row.selection)}</small> : null}
              </div>

              <div className={styles.ledgerMetrics}>
                <div><span>ENTRADA</span><b>{odds(row.entry_odds)}</b></div>
                <div><span>CIERRE</span><b>{odds(row.closing_odds)}</b></div>
                <div><span>MODELO</span><b>{pct(row.probability_own)}</b></div>
                <div><span>STAKE</span><b>{pct(row.stake_pct)}</b></div>
                <div><span>P&amp;L</span><b>{ars(row.pnl_ars)}</b></div>
                <div><span>LIQUIDADO</span><b>{artDateTime(row.settled_at)}</b></div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className={styles.subviewNote}>
        <span>REGLA</span>
        <p>
          Las predicciones publicadas no se alteran retroactivamente. El ledger
          usa Bet365 para entrada y cierre, y el P&amp;L se calcula en servidor.
        </p>
      </div>
    </section>
  );
}
