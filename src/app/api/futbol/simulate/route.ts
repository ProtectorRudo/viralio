import { simulateLearned } from "../learned-model";
import { NextResponse } from "next/server";

type RequestBody = {
  homeTeam: string;
  awayTeam: string;
  scenario?: "base" | "without-star";
  simulations?: number;
  seed?: number;
};

type TeamProfile = {
  attack: number;
  defense: number;
  cornersFor: number;
  cornersAgainst: number;
  yellows: number;
};

const TEAM_PROFILES: Record<string, TeamProfile> = {
  "Boca Juniors": { attack: 1.18, defense: 0.90, cornersFor: 5.8, cornersAgainst: 4.4, yellows: 2.4 },
  Estudiantes: { attack: 1.02, defense: 0.88, cornersFor: 4.9, cornersAgainst: 4.6, yellows: 2.6 },
  "River Plate": { attack: 1.22, defense: 0.89, cornersFor: 6.2, cornersAgainst: 4.1, yellows: 2.2 },
  "Racing Club": { attack: 1.10, defense: 0.94, cornersFor: 5.4, cornersAgainst: 4.8, yellows: 2.5 },
};

const DEFAULT_PROFILE: TeamProfile = {
  attack: 1,
  defense: 1,
  cornersFor: 5,
  cornersAgainst: 5,
  yellows: 2.4,
};

function modelInputs(body: RequestBody) {
  const home = TEAM_PROFILES[body.homeTeam] ?? DEFAULT_PROFILE;
  const away = TEAM_PROFILES[body.awayTeam] ?? DEFAULT_PROFILE;
  const scenarioFactor = body.scenario === "without-star" ? 0.88 : 1;
  const homeLambda = Math.min(
    Math.max(1.24 * home.attack * away.defense * 1.08 * scenarioFactor, 0.2),
    4.5,
  );
  const awayLambda = Math.min(
    Math.max(1.24 * away.attack * home.defense, 0.2),
    4.5,
  );

  return {
    home,
    away,
    homeLambda,
    awayLambda,
    simulations: Math.min(Math.max(body.simulations ?? 30000, 5000), 100000),
    seed: body.seed ?? 42,
  };
}

function hashSeed(input: string, seed: number) {
  let h = seed | 0;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 2654435761);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(lambda: number, rng: () => number) {
  const limit = Math.exp(-lambda);
  let product = 1;
  let k = 0;
  do {
    k += 1;
    product *= rng();
  } while (product > limit && k < 30);
  return k - 1;
}

function localFallback(body: RequestBody) {
  const inputs = modelInputs(body);
  const seed = hashSeed(
    `${body.homeTeam}|${body.awayTeam}|${body.scenario ?? "base"}`,
    inputs.seed,
  );
  const rng = mulberry32(seed);

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;
  let over25 = 0;
  let btts = 0;
  let totalCorners = 0;
  let cornersOver85 = 0;
  let cornersOver105 = 0;
  let totalYellows = 0;
  let cardsOver35 = 0;
  let cardsOver55 = 0;
  let anyRed = 0;
  let anyPenalty = 0;
  const scoreCounts = new Map<string, number>();

  const homeCornerMean = Math.max(
    (inputs.home.cornersFor + inputs.away.cornersAgainst) / 2,
    1,
  );
  const awayCornerMean = Math.max(
    (inputs.away.cornersFor + inputs.home.cornersAgainst) / 2,
    1,
  );

  for (let i = 0; i < inputs.simulations; i += 1) {
    const hg = poisson(inputs.homeLambda, rng);
    const ag = poisson(inputs.awayLambda, rng);
    const hc = poisson(homeCornerMean, rng);
    const ac = poisson(awayCornerMean, rng);
    const hy = poisson(inputs.home.yellows, rng);
    const ay = poisson(inputs.away.yellows, rng);
    const red = poisson(0.16, rng);
    const penalty = poisson(0.23, rng);

    if (hg > ag) homeWins += 1;
    else if (hg === ag) draws += 1;
    else awayWins += 1;

    totalHomeGoals += hg;
    totalAwayGoals += ag;
    if (hg + ag >= 3) over25 += 1;
    if (hg > 0 && ag > 0) btts += 1;

    const corners = hc + ac;
    totalCorners += corners;
    if (corners >= 9) cornersOver85 += 1;
    if (corners >= 11) cornersOver105 += 1;

    const yellows = hy + ay;
    totalYellows += yellows;
    if (yellows >= 4) cardsOver35 += 1;
    if (yellows >= 6) cardsOver55 += 1;
    if (red > 0) anyRed += 1;
    if (penalty > 0) anyPenalty += 1;

    const key = `${hg}-${ag}`;
    scoreCounts.set(key, (scoreCounts.get(key) ?? 0) + 1);
  }

  const topScorelines = [...scoreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([score, count]) => ({
      score,
      probability: count / inputs.simulations,
    }));

  return {
    source: "viralio-fallback",
    simulations: inputs.simulations,
    seed,
    homeTeam: body.homeTeam,
    awayTeam: body.awayTeam,
    homeWin: homeWins / inputs.simulations,
    draw: draws / inputs.simulations,
    awayWin: awayWins / inputs.simulations,
    expectedHomeGoals: totalHomeGoals / inputs.simulations,
    expectedAwayGoals: totalAwayGoals / inputs.simulations,
    over25: over25 / inputs.simulations,
    bothTeamsToScore: btts / inputs.simulations,
    meanTotalCorners: totalCorners / inputs.simulations,
    cornersOver85: cornersOver85 / inputs.simulations,
    cornersOver105: cornersOver105 / inputs.simulations,
    meanTotalYellows: totalYellows / inputs.simulations,
    cardsOver35: cardsOver35 / inputs.simulations,
    cardsOver55: cardsOver55 / inputs.simulations,
    redCardProbability: anyRed / inputs.simulations,
    penaltyProbability: anyPenalty / inputs.simulations,
    topScorelines,
    confidence: body.scenario === "without-star" ? 81 : 84,
  };
}

function normalizeBackend(
  data: Record<string, unknown>,
  body: RequestBody,
  simulations: number,
  seed: number,
) {
  const rawScorelines = Array.isArray(data.top_scorelines)
    ? data.top_scorelines
    : [];

  const topScorelines = rawScorelines
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const score = typeof record.score === "string" ? record.score : "";
      const probability = Number(record.probability ?? 0);
      return score ? { score, probability } : null;
    })
    .filter((item): item is { score: string; probability: number } => item !== null);

  return {
    source: "football-simulator",
    simulations,
    seed,
    homeTeam: body.homeTeam,
    awayTeam: body.awayTeam,
    homeWin: Number(data.home_win ?? 0),
    draw: Number(data.draw ?? 0),
    awayWin: Number(data.away_win ?? 0),
    expectedHomeGoals: Number(data.expected_home_goals ?? 0),
    expectedAwayGoals: Number(data.expected_away_goals ?? 0),
    over25: Number(data.over_2_5 ?? 0),
    bothTeamsToScore: Number(data.both_teams_to_score ?? 0),
    meanTotalCorners: Number(data.mean_total_corners ?? 0),
    cornersOver85: Number(data.probability_corners_over_8_5 ?? 0),
    cornersOver105: Number(data.probability_corners_over_10_5 ?? 0),
    meanTotalYellows: Number(data.mean_total_yellows ?? 0),
    cardsOver35: Number(data.probability_cards_over_3_5 ?? 0),
    cardsOver55: Number(data.probability_cards_over_5_5 ?? 0),
    redCardProbability: Number(data.probability_red_card ?? 0),
    penaltyProbability: Number(data.probability_penalty_awarded ?? 0),
    topScorelines,
    confidence: Number.isFinite(Number(data.data_confidence))
      ? Math.round(Number(data.data_confidence) * 100)
      : body.scenario === "without-star"
        ? 82
        : 86,
    modelKey: typeof data.model_key === "string" ? data.model_key : null,
    modelVersion: typeof data.model_version === "string" ? data.model_version : null,
    competitionKey:
      typeof data.competition_key === "string" ? data.competition_key : null,
    advancedXgAvailable:
      typeof data.advanced_xg_available === "boolean"
        ? data.advanced_xg_available
        : null,
    validationAlignedPredictions: Number.isFinite(
      Number(data.validation_aligned_predictions),
    )
      ? Number(data.validation_aligned_predictions)
      : null,
    validationBrierDelta: Number.isFinite(Number(data.validation_brier_delta))
      ? Number(data.validation_brier_delta)
      : null,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;

  if (!body.homeTeam || !body.awayTeam || body.homeTeam === body.awayTeam) {
    return NextResponse.json({ error: "Equipos inválidos" }, { status: 400 });
  }

  const backend = process.env.FOOTBALL_SIMULATOR_API_URL?.replace(/\/$/, "");
  const inputs = modelInputs(body);

  if (body.scenario !== "without-star") {
    const learned = simulateLearned({
      homeTeam: body.homeTeam,
      awayTeam: body.awayTeam,
      simulations: inputs.simulations,
      seed: inputs.seed,
    });
    if (learned) {
      return NextResponse.json(learned);
    }
  }

  if (backend) {
    if (body.scenario !== "without-star") {
      try {
        const learnedResponse = await fetch(`${backend}/api/v1/predict`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            home_team: body.homeTeam,
            away_team: body.awayTeam,
            simulations: inputs.simulations,
            seed: inputs.seed,
          }),
          cache: "no-store",
        });

        if (learnedResponse.ok) {
          const learnedData = (await learnedResponse.json()) as Record<string, unknown>;
          return NextResponse.json(
            normalizeBackend(learnedData, body, inputs.simulations, inputs.seed),
          );
        }
      } catch {
        // Try the lower-level backend simulation before using the local fallback.
      }
    }

    try {
      const response = await fetch(`${backend}/api/v1/simulate/full`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          home_team: body.homeTeam,
          away_team: body.awayTeam,
          home_lambda: inputs.homeLambda,
          away_lambda: inputs.awayLambda,
          home_corners_for: inputs.home.cornersFor,
          home_corners_against: inputs.home.cornersAgainst,
          away_corners_for: inputs.away.cornersFor,
          away_corners_against: inputs.away.cornersAgainst,
          home_yellows: inputs.home.yellows,
          away_yellows: inputs.away.yellows,
          simulations: inputs.simulations,
          seed: inputs.seed,
        }),
        cache: "no-store",
      });

      if (response.ok) {
        const data = (await response.json()) as Record<string, unknown>;
        return NextResponse.json(
          normalizeBackend(data, body, inputs.simulations, inputs.seed),
        );
      }
    } catch {
      // Fall through to the local, deterministic Monte Carlo engine.
    }
  }

  return NextResponse.json(localFallback(body));
}
