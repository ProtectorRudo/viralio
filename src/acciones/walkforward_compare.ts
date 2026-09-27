import type {
  WalkForwardObservation,
  WalkForwardResult,
} from "@/acciones/walkforward";

export type SavedWalkForwardRun = {
  id: string;
  createdAt: string;
  label: string;
  result: WalkForwardResult;
};

export type WalkForwardComparison = {
  compatible: boolean;
  compatibilityIssues: string[];
  leftLabel: string;
  rightLabel: string;
  commonObservations: number;
  changedSignalDates: number;
  signalAgreement: number | null;
  thresholdDelta: number;
  cumulativeReturnDelta: number;
  cagrDelta: number | null;
  maxDrawdownDelta: number;
  exposureDelta: number;
  hitRateDelta: number | null;
  medianAlpha20dDelta: number | null;
  medianAlpha63dDelta: number | null;
  periodReturnRmse: number | null;
};

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function delta(a: number | null | undefined, b: number | null | undefined) {
  if (
    typeof a !== "number" ||
    !Number.isFinite(a) ||
    typeof b !== "number" ||
    !Number.isFinite(b)
  ) {
    return null;
  }
  return b - a;
}

function netPeriodReturn(
  observation: WalkForwardObservation,
  transactionCostBps: number,
) {
  if (!observation.selected) return 0;
  return observation.return20d - (transactionCostBps * 2) / 10_000;
}

export function compareWalkForwardRuns(
  left: SavedWalkForwardRun,
  right: SavedWalkForwardRun,
): WalkForwardComparison {
  const a = left.result;
  const b = right.result;
  const issues: string[] = [];

  const requiredEqual: Array<[string, unknown, unknown]> = [
    ["ticker", a.ticker, b.ticker],
    ["methodology", a.methodology, b.methodology],
    ["historyYears", a.historyYears, b.historyYears],
    ["stepDays", a.stepDays, b.stepDays],
    ["transactionCostBps", a.transactionCostBps, b.transactionCostBps],
    ["startDate", a.startDate, b.startDate],
    ["endDate", a.endDate, b.endDate],
  ];

  for (const [key, leftValue, rightValue] of requiredEqual) {
    if (leftValue !== rightValue) {
      issues.push(
        `Parámetro distinto: ${key} (${String(leftValue)} vs ${String(rightValue)})`,
      );
    }
  }

  const leftByDate = new Map(
    a.observationsDetail.map((row) => [row.date, row] as const),
  );
  const rightByDate = new Map(
    b.observationsDetail.map((row) => [row.date, row] as const),
  );

  const commonDates = [...leftByDate.keys()]
    .filter((date) => rightByDate.has(date))
    .sort();

  let changedSignalDates = 0;
  let sameSignals = 0;
  const returnDiffs: number[] = [];

  for (const date of commonDates) {
    const leftRow = leftByDate.get(date)!;
    const rightRow = rightByDate.get(date)!;

    if (leftRow.selected === rightRow.selected) {
      sameSignals += 1;
    } else {
      changedSignalDates += 1;
    }

    const leftReturn = netPeriodReturn(leftRow, a.transactionCostBps);
    const rightReturn = netPeriodReturn(rightRow, b.transactionCostBps);
    returnDiffs.push(rightReturn - leftReturn);
  }

  const rmse = returnDiffs.length
    ? Math.sqrt(
        returnDiffs.reduce((sum, value) => sum + value ** 2, 0) /
          returnDiffs.length,
      )
    : null;

  return {
    compatible: issues.length === 0,
    compatibilityIssues: issues,
    leftLabel: left.label,
    rightLabel: right.label,
    commonObservations: commonDates.length,
    changedSignalDates,
    signalAgreement: commonDates.length
      ? sameSignals / commonDates.length
      : null,
    thresholdDelta: b.scoreThreshold - a.scoreThreshold,
    cumulativeReturnDelta: b.cumulativeReturn - a.cumulativeReturn,
    cagrDelta: delta(a.cagr, b.cagr),
    maxDrawdownDelta: b.maxDrawdown - a.maxDrawdown,
    exposureDelta: b.averageExposure - a.averageExposure,
    hitRateDelta: delta(a.hitRate20d, b.hitRate20d),
    medianAlpha20dDelta: delta(a.medianAlpha20d, b.medianAlpha20d),
    medianAlpha63dDelta: delta(a.medianAlpha63d, b.medianAlpha63d),
    periodReturnRmse: finite(rmse),
  };
}
