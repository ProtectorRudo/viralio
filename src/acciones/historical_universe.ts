import dataset from "@/acciones/data/sp500_history.generated.json";

type ChangeRow = {
  date: string;
  added: string[];
  removed: string[];
};

type Dataset = {
  source: {
    repository: string;
    commit: string;
    snapshotBlobSha: string;
    generatedAt: string;
    license: string;
    baselineDate: string;
    currentSnapshotDate: string;
    recommendedWebStartDate: string;
    note: string;
  };
  baselineSymbols: string[];
  changes: ChangeRow[];
};

const typed = dataset as Dataset;

export const SP500_UNIVERSE_SOURCE = typed.source;

export function normalizeProviderTicker(raw: string): string {
  return raw.trim().toUpperCase().replaceAll(".", "-");
}

export function sp500MembersAsOf(asOf: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    throw new Error("Fecha de universo inválida.");
  }

  if (asOf < typed.source.baselineDate) {
    return [];
  }

  const set = new Set(
    typed.baselineSymbols.map((symbol) => symbol.toUpperCase()),
  );

  for (const change of typed.changes) {
    if (change.date > asOf) break;

    for (const symbol of change.removed) {
      set.delete(symbol.toUpperCase());
    }
    for (const symbol of change.added) {
      set.add(symbol.toUpperCase());
    }
  }

  return [...set].sort();
}

export function sp500ProviderMembersAsOf(asOf: string): string[] {
  return sp500MembersAsOf(asOf).map(normalizeProviderTicker);
}

export function sp500UniverseChangeDates(
  startDate?: string,
  endDate?: string,
): string[] {
  return typed.changes
    .map((row) => row.date)
    .filter(
      (date) =>
        (!startDate || date >= startDate) && (!endDate || date <= endDate),
    );
}

export function sp500UniverseDiagnostics(asOf: string) {
  const members = sp500MembersAsOf(asOf);
  const dotted = members.filter((symbol) => symbol.includes("."));
  return {
    asOf,
    members: members.length,
    dottedSymbols: dotted,
    sourceRepository: typed.source.repository,
    sourceCommit: typed.source.commit,
    snapshotBlobSha: typed.source.snapshotBlobSha,
    baselineDate: typed.source.baselineDate,
    snapshotDate: typed.source.currentSnapshotDate,
    recommendedWebStartDate: typed.source.recommendedWebStartDate,
  };
}

export function sp500UniverseUnion(dates: string[]): string[] {
  const union = new Set<string>();
  for (const date of dates) {
    for (const ticker of sp500MembersAsOf(date)) union.add(ticker);
  }
  return [...union].sort();
}
