"use client";

import upcomingDenmark from "./upcoming-denmark-271.json";
import styles from "./football.module.css";

type UpcomingFixture = {
  fixture_id: number;
  kickoff_at: string;
  home_team: string;
  away_team: string;
};

type Props = {
  onSelect: (homeTeam: string, awayTeam: string) => void;
};

export default function UpcomingFixtures({ onSelect }: Props) {
  const fixtures = upcomingDenmark.fixtures as UpcomingFixture[];

  return (
    <section className={styles.upcomingPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>PRÓXIMOS PARTIDOS · DATOS REALES</span>
          <h3>Elegí un fixture real</h3>
        </div>
        <span className={styles.seed}>
          actualizado{" "}
          {new Date(upcomingDenmark.generated_at).toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
          })}
        </span>
      </div>

      <div className={styles.fixtureGrid}>
        {fixtures.slice(0, 8).map((fixture) => (
          <button
            type="button"
            className={styles.fixtureCard}
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
          </button>
        ))}
      </div>
    </section>
  );
}
