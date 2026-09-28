import snapshot from "./model-data/free-denmark-271.json";
import registry from "./model-data/free-denmark-271-registry.json";

type TeamProfile = {
  attack_strength: number;
  defense_strength: number;
  xg_attack_strength: number;
  xg_defense_strength: number;
  corners_for: number;
  corners_against: number;
  yellows: number;
  matches_used: number;
  data_completeness: number;
};

type RequestBody = {
  homeTeam: string;
  awayTeam: string;
  simulations: number;
  seed: number;
  scenario?: "base" | "without-star";
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

type SimulatedEvent = {
  minute: number;
  eventType: "goal" | "corner" | "yellow" | "red";
  side: "home" | "away";
  homeScore: number;
  awayScore: number;
};

function generateEventWorld(
  *,
  homeLambda: number,
  awayLambda: number,
  homeCornerMean: number,
  awayCornerMean: number,
  homeYellows: number,
  awayYellows: number,
  seed: number,
): SimulatedEvent[] {
  const rng = mulberry32(seed);
  const raw: Array<Omit<SimulatedEvent, "homeScore" | "awayScore">> = [];

  const addEvents = (
    count: number,
    eventType: SimulatedEvent["eventType"],
    side: SimulatedEvent["side"],
  ) => {
    for (let i = 0; i < count; i += 1) {
      const minute = Math.min(95, Math.max(1, 1 + Math.floor(rng() * 95)));
      raw.push({ minute, eventType, side });
    }
  };

  addEvents(poisson(homeLambda, rng), "goal", "home");
  addEvents(poisson(awayLambda, rng), "goal", "away");
  addEvents(poisson(homeCornerMean, rng), "corner", "home");
  addEvents(poisson(awayCornerMean, rng), "corner", "away");
  addEvents(poisson(homeYellows, rng), "yellow", "home");
  addEvents(poisson(awayYellows, rng), "yellow", "away");

  if (poisson(0.16, rng) > 0) {
    addEvents(1, "red", rng() >= 0.5 ? "home" : "away");
  }

  raw.sort((a, b) => a.minute - b.minute);

  let homeScore = 0;
  let awayScore = 0;
  return raw.map((event) => {
    if (event.eventType === "goal") {
      if (event.side === "home") homeScore += 1;
      else awayScore += 1;
    }
    return { ...event, homeScore, awayScore };
  });
}

function learnedInputs(home: TeamProfile, away: TeamProfile) {
  const goalsWeight = 0.45;
  const xgWeight = 0.55;
  const leagueGoals = snapshot.league.goals_per_team;

  const homeAttack =
    goalsWeight * home.attack_strength + xgWeight * home.xg_attack_strength;
  const homeOppDefense =
    goalsWeight * away.defense_strength + xgWeight * away.xg_defense_strength;
  const awayAttack =
    goalsWeight * away.attack_strength + xgWeight * away.xg_attack_strength;
  const awayOppDefense =
    goalsWeight * home.defense_strength + xgWeight * home.xg_defense_strength;

  const homeLambda = Math.min(
    Math.max(leagueGoals * homeAttack * homeOppDefense * 1.08, 0.15),
    4.5,
  );
  const awayLambda = Math.min(
    Math.max(leagueGoals * awayAttack * awayOppDefense, 0.15),
    4.5,
  );

  const completeness = (home.data_completeness + away.data_completeness) / 2;
  const sampleConfidence = Math.min((home.matches_used + away.matches_used) / 30, 1);
  const dataConfidence = Math.min(
    Math.max(0.65 * completeness + 0.35 * sampleConfidence, 0),
    1,
  );

  return { homeLambda, awayLambda, dataConfidence };
}

export function hasLearnedCoverage(homeTeam: string, awayTeam: string) {
  const teams = snapshot.teams as Record<string, TeamProfile>;
  return Boolean(teams[homeTeam] && teams[awayTeam]);
}

export function simulateLearned(body: RequestBody) {
  const teams = snapshot.teams as Record<string, TeamProfile>;
  const home = teams[body.homeTeam];
  const away = teams[body.awayTeam];
  if (!home || !away) return null;

  const baseInputs = learnedInputs(home, away);
  const inputs = {
    ...baseInputs,
    homeLambda:
      body.scenario === "without-star"
        ? Math.max(baseInputs.homeLambda * 0.88, 0.15)
        : baseInputs.homeLambda,
  };
  const simulations = Math.min(Math.max(body.simulations, 5000), 100000);
  const seed = hashSeed(
    `${body.homeTeam}|${body.awayTeam}|${body.scenario ?? "base"}|learned-v1`,
    body.seed,
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
  const scores = new Map<string, number>();

  const homeCornerMean = Math.max((home.corners_for + away.corners_against) / 2, 1);
  const awayCornerMean = Math.max((away.corners_for + home.corners_against) / 2, 1);
  const eventWorld = generateEventWorld({
    homeLambda: inputs.homeLambda,
    awayLambda: inputs.awayLambda,
    homeCornerMean,
    awayCornerMean,
    homeYellows: home.yellows,
    awayYellows: away.yellows,
    seed: hashSeed(
      `${body.homeTeam}|${body.awayTeam}|${body.scenario ?? "base"}|event-world`,
      body.seed,
    ),
  });

  for (let i = 0; i < simulations; i += 1) {
    const hg = poisson(inputs.homeLambda, rng);
    const ag = poisson(inputs.awayLambda, rng);
    const hc = poisson(homeCornerMean, rng);
    const ac = poisson(awayCornerMean, rng);
    const hy = poisson(home.yellows, rng);
    const ay = poisson(away.yellows, rng);
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
    scores.set(key, (scores.get(key) ?? 0) + 1);
  }

  const topScorelines = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([score, count]) => ({ score, probability: count / simulations }));

  return {
    source: "viralio-learned",
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
    confidence: Math.round(inputs.dataConfidence * 100),
    modelKey: registry.model_key,
    modelVersion: registry.model_version,
    competitionKey: registry.competition_key,
    advancedXgAvailable: registry.advanced_xg_available,
    validationAlignedPredictions: registry.validation.aligned_predictions,
    validationBrierDelta: registry.validation.delta,
    modelGeneratedAt: registry.generated_at,
    profileCutoffAt: registry.profile_cutoff_at,
    events: eventWorld,
  };
}
