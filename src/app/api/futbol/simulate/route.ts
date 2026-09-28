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
  const home = TEAM_PROFILES[body.homeTeam] ?? { attack: 1, defense: 1, cornersFor: 5, cornersAgainst: 5, yellows: 2.4 };
  const away = TEAM_PROFILES[body.awayTeam] ?? { attack: 1, defense: 1, cornersFor: 5, cornersAgainst: 5, yellows: 2.4 };

  const scenarioAttackFactor = body.scenario === "without-star" ? 0.88 : 1;
  const homeLambda = Math.min(Math.max(1.24 * home.attack * away.defense * 1.08 * scenarioAttackFactor, 0.2), 4.5);
  const awayLambda = Math.min(Math.max(1.24 * away.attack * home.defense, 0.2), 4.5);

  const simulations = Math.min(Math.max(body.simulations ?? 30000, 5000), 100000);
  const seed = hashSeed(`${body.homeTeam}|${body.awayTeam}|${body.scenario ?? "base"}`, body.seed ?? 42);
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

  const homeCornerMean = Math.max((home.cornersFor + away.cornersAgainst) / 2, 1);
  const awayCornerMean = Math.max((away.cornersFor + home.cornersAgainst) / 2, 1);
  const redRate = 0.16;
  const penaltyRate = 0.23;

  for (let i = 0; i < simulations; i += 1) {
    const hg = poisson(homeLambda, rng);
    const ag = poisson(awayLambda, rng);
    const hc = poisson(homeCornerMean, rng);
    const ac = poisson(awayCornerMean, rng);
    const hy = poisson(home.yellows, rng);
    const ay = poisson(away.yellows, rng);
    const red = poisson(redRate, rng);
    const penalty = poisson(penaltyRate, rng);

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
    .map(([score, count]) => ({ score, probability: count / simulations }));

  const confidence = body.scenario === "without-star" ? 81 : 84;

  return {
    source: "viralio-fallback",
    simulations,
    seed,
    homeTeam: body.homeTeam,
    awayTeam: body.awayTeam,
    homeWin: homeWins / simulations,
    draw: draws / simulations,
    awayWin: awayWins / simulations,
    expectedHomeGoals: totalHomeGoals / simulations,
    expectedAwayGoals: totalAwayGoals / simulations,
    over25: over25 / simulations,
    bothTeamsToScore: btts / simulations,
    meanTotalCorners: totalCorners / simulations,
    cornersOver85: cornersOver85 / simulations,
    cornersOver105: cornersOver105 / simulations,
    meanTotalYellows: totalYellows / simulations,
    cardsOver35: cardsOver35 / simulations,
    cardsOver55: cardsOver55 / simulations,
    redCardProbability: anyRed / simulations,
    penaltyProbability: anyPenalty / simulations,
    topScorelines,
    confidence,
    note:
      "Fallback Monte Carlo local. Se reemplaza automáticamente por football-simulator cuando se configure FOOTBALL_SIMULATOR_API_URL.",
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;

  if (!body.homeTeam || !body.awayTeam || body.homeTeam === body.awayTeam) {
    return NextResponse.json({ error: "Equipos inválidos" }, { status: 400 });
  }

  const backend = process.env.FOOTBALL_SIMULATOR_API_URL?.replace(/\/$/, "");

  if (backend) {
    try {
      const response = await fetch(`${backend}/api/v1/simulate/full`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          home_team: body.homeTeam,
          away_team: body.awayTeam,
          home_lambda: 1.4,
          away_lambda: 1.0,
          home_corners_for: 5.5,
          home_corners_against: 4.8,
          away_corners_for: 4.8,
          away_corners_against: 5.1,
          home_yellows: 2.4,
          away_yellows: 2.5,
          simulations: Math.min(body.simulations ?? 30000, 100000),
          seed: body.seed ?? 42,
        }),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ source: "football-simulator", ...data });
      }
    } catch {
      // Safe fallback below.
    }
  }

  return NextResponse.json(localFallback(body));
}
