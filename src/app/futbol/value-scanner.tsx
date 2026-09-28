"use client";

import { useMemo, useState } from "react";
import { simulateLearned } from "../api/futbol/learned-model";
import upcomingDenmark from "./upcoming-denmark-271.json";
import upcomingOdds from "./upcoming-denmark-271-odds.json";
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
  label: "1" | "X" | "2" | "1X" | "X2" | "12";
  probability: number;
};

type OddsQuote = {
  value: number;
  bookmaker_id: number | null;
  bookmaker: string | null;
  updated_at: string | null;
};

type FixtureOdds = {
  "1X2": Record<"1" | "X" | "2", OddsQuote | null>;
  double_chance: Record<"1X" | "X2" | "12", OddsQuote | null>;
};

function marketCandidates(
  home: number,
  draw: number,
  away: number,
): MarketCandidate[] {
  return [
    { label: "1", probability: home },
    { label: "X", probability: draw },
    { label: "2", probability: away },
    { label: "1X", probability: home + draw },
    { label: "X2", probability: draw + away },
    { label: "12", probability: home + away },
  ];
}

function quoteFor(
  fixtureOdds: FixtureOdds | undefined,
  label: MarketCandidate["label"],
) {
  if (!fixtureOdds) return null;
  if (label === "1" || label === "X" || label === "2") {
    return fixtureOdds["1X2"][label];
  }
  return fixtureOdds.double_chance[label];
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

        const oddsMap = upcomingOdds.fixtures as Record<string, FixtureOdds>;
        const fixtureOdds = oddsMap[String(fixture.fixture_id)];

        const candidates = marketCandidates(
          prediction.homeWin,
          prediction.draw,
          prediction.awayWin,
        ).map((market) => {
          const quote = quoteFor(fixtureOdds, market.label);
          const edge = quote
            ? expectedValueEdge(market.probability, quote.value)
            : null;
          return { market, quote, edge };
        });

        const withQuotes = candidates.filter((candidate) => candidate.quote);
        const selected =
          withQuotes.length > 0
            ? withQuotes.sort(
                (a, b) => (b.edge ?? -Infinity) - (a.edge ?? -Infinity),
              )[0]
            : candidates.sort(
                (a, b) => b.market.probability - a.market.probability,
              )[0];

        return {
          fixture,
          market: selected.market,
          quote: selected.quote,
          edge: selected.edge,
          fair: fairOdds(selected.market.probability),
          minimum: minimumValueOdds(selected.market.probability),
        };
      })
        .filter(Boolean)
        .sort(
          (a, b) =>
            ((b?.edge ?? -Infinity) as number) -
            ((a?.edge ?? -Infinity) as number),
        ),
    [fixtures],
  );

  return (
    <section className={styles.scannerPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>ESCÁNER DE CUOTAS</span>
          <h3>¿Dónde mirar primero?</h3>
          <p className={styles.scannerIntro}>
            Revisa 1, X, 2, 1X, X2 y 12 con cuotas reales y ordena por mayor edge
            estimado. Podés editar la cuota si querés comparar otra casa.
          </p>
        </div>
        <span className={styles.valueRule}>
          cuotas reales · {new Date(upcomingOdds.generated_at).toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className={styles.scannerRows}>
        {rows.map((row) => {
          if (!row) return null;

          const raw =
            bookmakerOdds[row.fixture.fixture_id] ??
            (row.quote ? row.quote.value.toFixed(2) : "");
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
                <span>{row.quote?.bookmaker ?? "Casa"}</span>
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

              <span
                className={
                  edge !== null && edge >= 0.10
                    ? `${styles.scannerBadge} ${styles.scannerBadgeStrong}`
                    : styles.scannerBadge
                }
              >
                {row.quote
                  ? edge !== null && edge >= 0.10
                    ? "VALOR FUERTE"
                    : status.label
                  : "SIN CUOTA"}
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
