"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./maurilio-fallback.module.css";
import type {
  PublicTipsterCard,
  TipsterSearchResponse,
} from "./tipsters-data";

type SortKey = "history" | "roi" | "clv";

function metric(value: number | null, suffix = "%") {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}${suffix}`;
}

function price(value: number | null) {
  if (value === null) return "Sin plan todavía";
  return (
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value) + " · 30 días"
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Card({
  tipster,
  sponsored = false,
}: {
  tipster: PublicTipsterCard;
  sponsored?: boolean;
}) {
  return (
    <article className={styles.tipsterCard}>
      <div className={styles.tipsterCardTop}>
        <div className={styles.tipsterIdentity}>
          <div className={styles.tipsterAvatar}>
            {tipster.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tipster.avatar_url} alt="" />
            ) : (
              <span>{initials(tipster.display_name) || "T"}</span>
            )}
          </div>
          <div>
            <div className={styles.tipsterNameLine}>
              <h3>{tipster.display_name}</h3>
              {tipster.is_verified ? <b title="Perfil verificado">✓</b> : null}
            </div>
            <p>{tipster.headline || "Tipster de Maurilio"}</p>
          </div>
        </div>

        {sponsored ? (
          <span className={styles.sponsoredBadge}>Patrocinado</span>
        ) : null}
      </div>

      <div className={styles.tipsterTags}>
        {[...tipster.sports, ...tipster.specialties].slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className={styles.tipsterStats}>
        <div>
          <span>ROI 90D</span>
          <b>{metric(tipster.roi_pct_90d)}</b>
        </div>
        <div>
          <span>CLV</span>
          <b>{metric(tipster.avg_clv_pct_90d)}</b>
        </div>
        <div>
          <span>PICKS 90D</span>
          <b>{tipster.picks_count_90d}</b>
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

      <div className={styles.tipsterCardBottom}>
        <div>
          <strong>
            🔒 {tipster.open_tips_count}{" "}
            {tipster.open_tips_count === 1 ? "tip activo" : "tips activos"}
          </strong>
          <span>
            {tipster.picks_count_90d > 0
              ? `${price(tipster.monthly_price_ars)}`
              : "Sin historial suficiente todavía"}
          </span>
        </div>

        <Link href={`/maurilio/tipsters/${tipster.slug}`}>
          Ver perfil
        </Link>
      </div>
    </article>
  );
}

export default function TipsterMarketplace({
  data,
}: {
  data: TipsterSearchResponse;
}) {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("Todos");
  const [sort, setSort] = useState<SortKey>("history");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matches = (tipster: PublicTipsterCard) => {
      const haystack = [
        tipster.display_name,
        tipster.headline ?? "",
        ...tipster.sports,
        ...tipster.specialties,
      ]
        .join(" ")
        .toLowerCase();

      const queryMatch = !q || haystack.includes(q);
      const sportMatch =
        sport === "Todos" ||
        tipster.sports.some(
          (item) => item.toLowerCase() === sport.toLowerCase(),
        );

      return queryMatch && sportMatch;
    };

    return [...data.results].filter(matches).sort((a, b) => {
      if (sort === "roi") {
        return (
          (b.roi_pct_90d ?? -9999) - (a.roi_pct_90d ?? -9999) ||
          b.picks_count_90d - a.picks_count_90d
        );
      }

      if (sort === "clv") {
        return (
          (b.avg_clv_pct_90d ?? -9999) - (a.avg_clv_pct_90d ?? -9999) ||
          b.picks_count_90d - a.picks_count_90d
        );
      }

      return (
        b.picks_count_90d - a.picks_count_90d ||
        (b.roi_pct_90d ?? -9999) - (a.roi_pct_90d ?? -9999)
      );
    });
  }, [data.results, query, sort, sport]);

  const sponsored = useMemo(() => {
    const q = query.trim().toLowerCase();

    return data.sponsored.filter((tipster) => {
      const haystack = [
        tipster.display_name,
        tipster.headline ?? "",
        ...tipster.sports,
        ...tipster.specialties,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!q || haystack.includes(q)) &&
        (sport === "Todos" ||
          tipster.sports.some(
            (item) => item.toLowerCase() === sport.toLowerCase(),
          ))
      );
    });
  }, [data.sponsored, query, sport]);

  return (
    <section className={styles.marketplace}>
      <div className={styles.marketplaceHero}>
        <span>TIPSTERS VERIFICADOS</span>
        <h1>Encontrá a quién seguir.</h1>
        <p>
          Mirá resultados reales, compará rendimiento y elegí por historial.
          Los tips futuros permanecen bloqueados hasta que exista una
          suscripción.
        </p>
      </div>

      <div className={styles.tipsterSearch}>
        <label>
          <span>Buscar tipster</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, deporte o especialidad"
          />
        </label>

        <div className={styles.tipsterFilters}>
          <button
            type="button"
            className={sport === "Todos" ? styles.filterActive : undefined}
            onClick={() => setSport("Todos")}
          >
            Todos
          </button>
          {data.sports.slice(0, 6).map((item) => (
            <button
              key={item}
              type="button"
              className={sport === item ? styles.filterActive : undefined}
              onClick={() => setSport(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <label className={styles.sortSelect}>
          <span>Ordenar</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
          >
            <option value="history">Más historial</option>
            <option value="roi">ROI 90D</option>
            <option value="clv">CLV</option>
          </select>
        </label>
      </div>

      {sponsored.length > 0 ? (
        <div className={styles.tipsterSection}>
          <div className={styles.tipsterSectionTitle}>
            <div>
              <span>PUBLICIDAD INTERNA</span>
              <h2>Patrocinados</h2>
            </div>
            <p>
              Pagan por aparecer arriba. Sus métricas siguen siendo exactamente
              las mismas que en el ranking orgánico.
            </p>
          </div>
          <div className={styles.tipsterGrid}>
            {sponsored.map((tipster) => (
              <Card key={tipster.id} tipster={tipster} sponsored />
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.tipsterSection}>
        <div className={styles.tipsterSectionTitle}>
          <div>
            <span>HISTORIAL VERIFICADO</span>
            <h2>Todos los tipsters</h2>
          </div>
          <p>
            Sólo cuentan picks registrados y liquidados dentro de Maurilio.
          </p>
        </div>

        {results.length > 0 ? (
          <div className={styles.tipsterGrid}>
            {results.map((tipster) => (
              <Card key={tipster.id} tipster={tipster} />
            ))}
          </div>
        ) : (
          <div className={styles.tipsterEmpty}>
            <b>No encontramos tipsters con esos filtros.</b>
            <p>Probá otro nombre, deporte o criterio.</p>
          </div>
        )}
      </div>
    </section>
  );
}
