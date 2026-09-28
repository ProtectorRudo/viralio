"use client";

import { useMemo, useState } from "react";
import { simulateLearned } from "../api/futbol/learned-model";
import upcomingDenmark from "./upcoming-denmark-271.json";
import {
  classifyValue,
  expectedValueEdge,
  fairOdds,
  minimumValueOdds,
  parseDecimalOdds,
} from "./bet-value";
import styles from "./football.module.css";

type UpcomingFixture = {
  fixture_id: number;
  kickoff_at: string;
  home_team: string;
  away_team: string;
};

type MarketCandidate = {
  label: string;
  probability: number;
};

function strongestMarket(
  home: number,
  draw: number,
  away: number,
): MarketCandidate {
  const candidates: MarketCandidate[] = [
    { label: "1", probability: home },
    { label: "X", probability: draw },
    { label: "2", probability: away },
    { label: "1X", probability: home + draw },
    { label: "X2", probability: draw + away },
    { label: "12", probability: home + away },
  ];

  return candidates.sort((a, b) => b.probability - a.probability)[0];
}

export default function ValueScanner() {
  const fixtures = upcomingDenmark.fixtures as UpcomingFixture[];
  const [bookmakerOdds, setBookmakerOdds] = useState<Record<number, string>>({});

  const rows = useMemo(
    () =>
      fixtures.slice(0, 8).map((fixture) => {
        const prediction = simulateLearned({
          homeTeam: fixture.home_team,
          awayTeam: fixture.away_team,
          simulations: 5000,
          seed: fixture.fixture_id,
          scenario: "base",
        });

        if (!prediction) {
          return null;
        }

        const market = strongestMarket(
          prediction.homeWin,
          prediction.draw,
          prediction.awayWin,
        );

        return {
          fixture,
          market,
          fair: fairOdds(market.probability),
          minimum: minimumValueOdds(market.probability),
        };
      }).filter(Boolean),
    [fixtures],
  );

  return (
    <section className={styles.scannerPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>ESCÁNER DE CUOTAS</span>
          <h3>¿Dónde mirar primero?</h3>
          <p className={styles.scannerIntro}>
            Muestra el mercado 1X2/doble oportunidad de mayor probabilidad por partido.
            Ingresá la cuota de la casa para validar si supera el mínimo.
          </p>
        </div>
        <span className={styles.valueRule}>+5% edge mínimo</span>
      </div>

      <div className={styles.scannerRows}>
        {rows.map((row) => {
          if (!row) return null;

          const raw = bookmakerOdds[row.fixture.fixture_id] ?? "";
          const bookmaker = parseDecimalOdds(raw);
          const status = classifyValue(bookmaker, row.fair, row.minimum);
          const edge =
            bookmaker === null
              ? null
              : expectedValueEdge(row.market.probability, bookmaker);

          return (
            <article
              className={`${styles.scannerRow} ${styles[`scannerRow_${status.tone}`]}`}
              key={row.fixture.fixture_id}
            >
              <div className={styles.scannerFixture}>
                <span>
                  {new Date(row.fixture.kickoff_at).toLocaleString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <strong>
                  {row.fixture.home_team} vs {row.fixture.away_team}
                </strong>
              </div>

              <div className={styles.scannerMarket}>
                <span>Mercado</span>
                <strong>{row.market.label}</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Prob.</span>
                <strong>{(row.market.probability * 100).toFixed(1)}%</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Justa</span>
                <strong>{row.fair.toFixed(2)}</strong>
              </div>

              <div className={styles.scannerMetric}>
                <span>Mínima</span>
                <strong className={styles.scannerMinimum}>
                  {row.minimum.toFixed(2)}
                </strong>
              </div>

              <label className={styles.scannerInput}>
                <span>Casa</span>
                <input
                  inputMode="decimal"
                  placeholder={row.minimum.toFixed(2)}
                  value={raw}
                  onChange={(event) =>
                    setBookmakerOdds((current) => ({
                      ...current,
                      [row.fixture.fixture_id]: event.target.value,
                    }))
                  }
                />
              </label>

              <span className={styles.scannerBadge}>
                {status.label}
                {edge !== null ? (
                  <small>
                    {edge >= 0 ? "+" : ""}
                    {(edge * 100).toFixed(1)}%
                  </small>
                ) : null}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
