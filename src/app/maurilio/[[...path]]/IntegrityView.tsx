import styles from "./maurilio-fallback.module.css";
import {
  ars,
  artDateTime,
  fetchMaurilioGateway,
  type IntegrityState,
} from "./maurilio-data";

const rules = [
  ["01", "BET365 ONLY", "Entrada y cierre usan exclusivamente Bet365."],
  ["02", "IMMUTABLE PICK", "Evento, mercado, precio, modelo y stake no se reescriben después de publicar."],
  ["03", "ROBUST LOWER BOUND", "El EV debe seguir siendo positivo en el piso del rango probabilístico."],
  ["04", "MINIMUM PRICE", "Si Bet365 cae debajo de la cuota mínima, la entrada deja de ser válida."],
  ["05", "2% MAX / PICK", "Ninguna entrada puede superar el 2% de la banca."],
  ["06", "6% MAX EXPOSURE", "La exposición simultánea está limitada por backend."],
  ["07", "EVENT CUTOFF", "No se publica ni vende una señal después de iniciado el evento."],
  ["08", "APPEND-ONLY AUDIT", "Publicación, risk stop y settlement generan trazabilidad inmutable."],
];

const auditLabels: Record<string, string> = {
  matchday_published: "MATCHDAY PUBLISHED",
  pick_published: "PICK PUBLISHED",
  sale_closed: "ENTRY CLOSED",
  pick_settled: "PICK SETTLED",
};

export default async function IntegrityView() {
  const data = await fetchMaurilioGateway<IntegrityState>("integrity");
  const state = data?.state ?? null;
  const risk = state?.risk ?? null;
  const latest = data?.audit?.[0] ?? null;

  return (
    <section className={styles.subview}>
      <div className={styles.subviewHero}>
        <span>INTEGRITY / PROOF OF PROCESS</span>
        <h1>No pedimos confianza ciega.</h1>
        <p>
          Exponemos reglas operativas y estado verificable sin revelar contenido
          premium vigente ni información de compradores.
        </p>
      </div>

      <div className={styles.integrityStatus}>
        <article>
          <span>SISTEMA</span>
          <b>{state?.status ?? "UNAVAILABLE"}</b>
          <small>{state?.label ?? "Estado no verificado"}</small>
        </article>
        <article>
          <span>BANCA AUDITADA</span>
          <b>{ars(risk?.bank_ars)}</b>
          <small>Derivada del P&amp;L liquidado</small>
        </article>
        <article>
          <span>LIQUIDADAS</span>
          <b>{String(risk?.settled_count ?? 0)}</b>
          <small>Historial real</small>
        </article>
        <article>
          <span>ÚLTIMO EVENTO</span>
          <b>{latest ? auditLabels[latest.event_type] ?? latest.event_type.toUpperCase() : "—"}</b>
          <small>{latest ? artDateTime(latest.created_at) : "Sin eventos todavía"}</small>
        </article>
      </div>

      <div className={styles.integrityRules}>
        {rules.map(([id, title, body]) => (
          <article key={id}>
            <span>{id}</span>
            <b>{title}</b>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <div className={styles.auditStrip}>
        <span>AUDIT TRAIL</span>
        {data?.audit?.length ? (
          <div>
            {data.audit.slice(0, 8).map((event, index) => (
              <i key={`${event.event_type}-${event.created_at}-${index}`}>
                <b>{auditLabels[event.event_type] ?? event.event_type.toUpperCase()}</b>
                <small>{artDateTime(event.created_at)}</small>
              </i>
            ))}
          </div>
        ) : (
          <p>Todavía no hay eventos operativos públicos.</p>
        )}
      </div>
    </section>
  );
}
