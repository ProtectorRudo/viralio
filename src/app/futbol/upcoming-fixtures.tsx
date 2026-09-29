"use client";

import { useMemo } from "react";
import { simulateLearned } from "../api/futbol/learned-model";
import { confidenceAdjustedEdgeBuffer, minimumValueOdds } from "./bet-value";
import { useLiveUpcomingDenmark } from "./live-upcoming-denmark";
import styles from "./football.module.css";

type UpcomingFixture = {
  fixture_id: number;
  kickoff_at: string;
  home_team: string;
  away_team: string;
};

type Props = {
  onSelect: (homeTeam: string, awayTeam: string) => void;
  activeHome: string;
  activeAway: string;
};

export default function UpcomingFixtures({
  onSelect,
  activeHome,
  activeAway,
}: Props) {
  const upcomingDenmark = useLiveUpcomingDenmark();
  const fixtures = upcomingDenmark.fixtures as UpcomingFixture[];
  const cards = useMemo(
    () =>
      fixtures.slice(0, 8).map((fixture) => {
        const prediction = simulateLearned({
          homeTeam: fixture.home_team,
          awayTeam: fixture.away_team,
          simulations: 5000,
          seed: fixture.fixture_id,
          scenario: "base",
        });
        const edgeBuffer = prediction
          ? confidenceAdjustedEdgeBuffer(prediction.confidence)
          : 0.05;
        return { fixture, prediction, edgeBuffer };
      }),
    [fixtures],
  );

  return (
    <section className={styles.upcomingPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>PRÓXIMOS PARTIDOS · DATOS REALES</span>
          <h3>Elegí un fixture real</h3>
          <p className={styles.fixtureHint}>
            Probabilidad del modelo · mín = cuota mínima con 5% de edge.
          </p>
        </div>
        <span className={styles.seed}>
          actualizado{" "}
          {new Date(upcomingDenmark.generated_at).toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
          })}
        </span>
      </div>

      <div className={styles.fixtureGrid}>
        {cards.map(({ fixture, prediction, edgeBuffer }) => (
          <button
            type="button"
            className={
              fixture.home_team === activeHome && fixture.away_team === activeAway
                ? `${styles.fixtureCard} ${styles.fixtureCardActive}`
                : styles.fixtureCard
            }
            key={fixture.fixture_id}
            onClick={() => onSelect(fixture.home_team, fixture.away_team)}
          >
            <span>
              {new Date(fixture.kickoff_at).toLocaleString("es-AR", {
                timeZone: "America/Argentina/Buenos_Aires",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <strong>{fixture.home_team}</strong>
            <em>vs</em>
            <strong>{fixture.away_team}</strong>

            {prediction ? (
              <>
                <div className={styles.fixturePrediction}>
                  <span>
                    <b>1</b> {(prediction.homeWin * 100).toFixed(0)}%
                    <small>mín {minimumValueOdds(prediction.homeWin, edgeBuffer).toFixed(2)}</small>
                  </span>
                  <span>
                    <b>X</b> {(prediction.draw * 100).toFixed(0)}%
                    <small>mín {minimumValueOdds(prediction.draw, edgeBuffer).toFixed(2)}</small>
                  </span>
                  <span>
                    <b>2</b> {(prediction.awayWin * 100).toFixed(0)}%
                    <small>mín {minimumValueOdds(prediction.awayWin, edgeBuffer).toFixed(2)}</small>
                  </span>
                </div>

                <div className={styles.fixtureDoubleChance}>
                  <span>
                    <b>1X</b>
                    <small>
                      mín {minimumValueOdds(prediction.homeWin + prediction.draw, edgeBuffer).toFixed(2)}
                    </small>
                  </span>
                  <span>
                    <b>X2</b>
                    <small>
                      mín {minimumValueOdds(prediction.draw + prediction.awayWin, edgeBuffer).toFixed(2)}
                    </small>
                  </span>
                  <span>
                    <b>12</b>
                    <small>
                      mín {minimumValueOdds(prediction.homeWin + prediction.awayWin, edgeBuffer).toFixed(2)}
                    </small>
                  </span>
                </div>
              </>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
