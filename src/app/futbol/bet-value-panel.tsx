"use client";

import {
  confidenceAdjustedEdgeBuffer,
  minimumValueOdds,
} from "./bet-value";
import styles from "./football.module.css";

type Props = {
  homeLabel: string;
  awayLabel: string;
  homeTeamName: string;
  awayTeamName: string;
  homeProbability: number;
  drawProbability: number;
  awayProbability: number;
  over25Probability: number;
  bttsProbability: number;
  cornersOver85Probability: number;
  cardsOver35Probability: number;
  dataConfidence: number;
};

type MarketCard = {
  key: string;
  label: string;
  detail?: string;
  probability: number;
};

function ValueThreshold({
  probability,
  edgeBuffer,
}: {
  probability: number;
  edgeBuffer: number;
}) {
  const minimum = minimumValueOdds(probability, edgeBuffer);

  return (
    <div className={styles.valueThresholdHero}>
      <span>HAY VALOR DESDE</span>
      <strong>{minimum.toFixed(2)}</strong>
      <small>Buscá una cuota igual o superior</small>
    </div>
  );
}

export default function BetValuePanel({
  homeLabel,
  awayLabel,
  homeProbability,
  drawProbability,
  awayProbability,
  over25Probability,
  bttsProbability,
  cornersOver85Probability,
  cardsOver35Probability,
  dataConfidence,
}: Props) {
  const edgeBuffer = confidenceAdjustedEdgeBuffer(dataConfidence);

  const oneXTwo: MarketCard[] = [
    { key: "1", label: homeLabel, probability: homeProbability },
    { key: "X", label: "Empate", probability: drawProbability },
    { key: "2", label: awayLabel, probability: awayProbability },
  ];

  const doubleChance: MarketCard[] = [
    {
      key: "1X",
      label: "1X",
      detail: `${homeLabel} o empate`,
      probability: homeProbability + drawProbability,
    },
    {
      key: "X2",
      label: "X2",
      detail: `Empate o ${awayLabel}`,
      probability: drawProbability + awayProbability,
    },
    {
      key: "12",
      label: "12",
      detail: "Sin empate",
      probability: homeProbability + awayProbability,
    },
  ];

  const secondary: MarketCard[] = [
    {
      key: "over25",
      label: "+2.5 goles",
      probability: over25Probability,
    },
    {
      key: "btts",
      label: "Ambos marcan",
      probability: bttsProbability,
    },
    {
      key: "corners",
      label: "+8.5 corners",
      probability: cornersOver85Probability,
    },
    {
      key: "cards",
      label: "+3.5 tarjetas",
      probability: cardsOver35Probability,
    },
  ];

  return (
    <section className={styles.valuePanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>CUOTAS MÍNIMAS CON VALOR</span>
          <h3>¿Desde qué cuota conviene mirar?</h3>
          <p className={styles.valueIntro}>
            Compará la cuota que encontrás con este mínimo. Si es igual o
            superior, existe valor según la probabilidad del modelo.
          </p>
        </div>
        <span className={styles.valueRule}>
          margen +{(edgeBuffer * 100).toFixed(1)}% · confianza {dataConfidence}%
        </span>
      </div>

      <div className={styles.valueGrid}>
        {oneXTwo.map((market) => (
          <article className={styles.valueCard} key={market.key}>
            <div className={styles.valueCardTop}>
              <div>
                <span>{market.key}</span>
                <strong>{market.label}</strong>
              </div>
              <span className={styles.valueBadge}>
                {(market.probability * 100).toFixed(1)}%
              </span>
            </div>
            <ValueThreshold
              probability={market.probability}
              edgeBuffer={edgeBuffer}
            />
          </article>
        ))}
      </div>

      <div className={styles.doubleChanceHeader}>
        <div>
          <span className={styles.eyebrow}>DOBLE OPORTUNIDAD</span>
          <h4>1X · X2 · 12</h4>
        </div>
        <span>cuota mínima para que haya valor</span>
      </div>

      <div className={styles.doubleChanceGrid}>
        {doubleChance.map((market) => (
          <article className={styles.doubleChanceCard} key={market.key}>
            <div className={styles.valueCardTop}>
              <div>
                <span>{market.detail}</span>
                <strong>{market.label}</strong>
              </div>
              <span className={styles.valueBadge}>
                {(market.probability * 100).toFixed(1)}%
              </span>
            </div>
            <ValueThreshold
              probability={market.probability}
              edgeBuffer={edgeBuffer}
            />
          </article>
        ))}
      </div>

      <div className={styles.quickValueMarkets}>
        {secondary.map((market) => (
          <article key={market.key}>
            <span>{market.label}</span>
            <strong>{(market.probability * 100).toFixed(1)}%</strong>
            <small>
              Hay valor desde{" "}
              <b>
                {minimumValueOdds(market.probability, edgeBuffer).toFixed(2)}
              </b>
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
