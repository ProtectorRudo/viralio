import Link from "next/link";
import styles from "./maurilio-fallback.module.css";
import SubscribeButton from "./SubscribeButton";
import type { TipsterProfileResponse } from "./tipsters-data";

function number(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pct(value: number | null, signed = false) {
  if (value === null) return "—";
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function odds(value: number | string | null | undefined) {
  const parsed = number(value);
  return parsed === null ? "—" : `@${parsed.toFixed(2)}`;
}

function units(value: number | string | null | undefined) {
  const parsed = number(value);
  if (parsed === null) return "—";
  const sign = parsed > 0 ? "+" : "";
  return `${sign}${parsed.toFixed(2)}u`;
}

function date(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(parsed);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function TipsterProfile({
  data,
}: {
  data: TipsterProfileResponse;
}) {
  const { tipster } = data;

  return (
    <section className={styles.tipsterProfile}>
      <Link className={styles.profileBack} href="/maurilio/tipsters">
        ← Buscar tipsters
      </Link>

      <div className={styles.profileHeader}>
        <div className={styles.profileIdentity}>
          <div className={styles.profileAvatar}>
            {tipster.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tipster.avatar_url} alt="" />
            ) : (
              <span>{initials(tipster.display_name) || "T"}</span>
            )}
          </div>

          <div>
            <div className={styles.tipsterNameLine}>
              <h1>{tipster.display_name}</h1>
              {tipster.is_verified ? <b>✓</b> : null}
            </div>
            <p>{tipster.headline || "Tipster de Maurilio"}</p>
            <div className={styles.tipsterTags}>
              {[...tipster.sports, ...tipster.specialties]
                .slice(0, 6)
                .map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
            </div>
          </div>
        </div>

        <div className={styles.profileSubscribe}>
          <strong>
            {tipster.monthly_price_ars === null
              ? "Sin plan todavía"
              : new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  maximumFractionDigits: 0,
                }).format(tipster.monthly_price_ars) + "/mes"}
          </strong>
          <SubscribeButton
            slug={tipster.slug}
            enabled={
              tipster.accepting_subscribers &&
              tipster.monthly_price_ars !== null &&
              tipster.monthly_price_ars > 0
            }
          />
        </div>
      </div>

      <div className={styles.profileStats}>
        <div>
          <span>ROI 90D</span>
          <b>{pct(tipster.roi_pct_90d, true)}</b>
        </div>
        <div>
          <span>CLV</span>
          <b>{pct(tipster.avg_clv_pct_90d, true)}</b>
        </div>
        <div>
          <span>PICKS 90D</span>
          <b>{tipster.picks_count_90d}</b>
        </div>
        <div>
          <span>WIN RATE</span>
          <b>{pct(tipster.win_rate_pct_90d)}</b>
        </div>
        <div>
          <span>CUOTA MEDIA</span>
          <b>
            {tipster.avg_odds_90d === null
              ? "—"
              : tipster.avg_odds_90d.toFixed(2)}
          </b>
        </div>
        <div>
          <span>MAX DD</span>
          <b>
            {tipster.max_drawdown_units_90d === null
              ? "—"
              : `-${tipster.max_drawdown_units_90d.toFixed(1)}u`}
          </b>
        </div>
      </div>

      <div className={styles.lockedFuture}>
        <div>
          <span>TIPS FUTUROS</span>
          <h2>
            🔒 {data.future.count}{" "}
            {data.future.count === 1 ? "tip activo" : "tips activos"}
          </h2>
          <p>
            La selección no es pública. Sólo los suscriptores activos pueden
            verla antes del evento; después queda incorporada al historial
            verificable del tipster.
          </p>
        </div>
        <b>CONTENIDO BLOQUEADO</b>
      </div>

      <div className={styles.historySection}>
        <div className={styles.tipsterSectionTitle}>
          <div>
            <span>100% REGISTRADO EN MAURILIO</span>
            <h2>Historial</h2>
          </div>
          <p>
            Publicación, cuota y hash quedan fijados antes del evento.
          </p>
        </div>

        {data.history.length > 0 ? (
          <div className={styles.historyList}>
            {data.history.map((row) => (
              <article key={row.public_id} className={styles.historyRow}>
                <div className={styles.historyMain}>
                  <div>
                    <span>{date(row.settled_at)}</span>
                    <h3>{row.event}</h3>
                    <p>{row.competition}</p>
                  </div>
                  <strong
                    className={
                      row.result === "win"
                        ? styles.historyWin
                        : row.result === "loss"
                          ? styles.historyLoss
                          : undefined
                    }
                  >
                    {row.result.toUpperCase()}
                  </strong>
                </div>

                <div className={styles.historySelection}>
                  <span>{row.market}</span>
                  <b>{row.selection}</b>
                </div>

                <div className={styles.historyMetrics}>
                  <div><span>ENTRADA</span><b>{odds(row.entry_odds)}</b></div>
                  <div><span>CIERRE</span><b>{odds(row.closing_odds)}</b></div>
                  <div><span>STAKE</span><b>{number(row.stake_units)?.toFixed(2) ?? "—"}u</b></div>
                  <div><span>P&amp;L</span><b>{units(row.profit_units)}</b></div>
                  <div><span>CLV</span><b>{pct(number(row.clv_pct), true)}</b></div>
                </div>

                <small className={styles.hashProof}>
                  HASH {row.content_hash.slice(0, 12).toUpperCase()}…
                </small>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.tipsterEmpty}>
            <b>Todavía no hay picks liquidados.</b>
            <p>
              Este perfil empieza desde cero. No aceptamos historial cargado a
              mano.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
