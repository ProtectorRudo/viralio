export type PersistenceKind = "json" | "postgres";

export interface PersistenceEnvironment {
  NODE_ENV?: string;
  VIRALIO_PERSISTENCE?: string;
  DATABASE_URL?: string;
}

export interface PersistenceConfig {
  kind: PersistenceKind;
  databaseUrl?: string;
}

export function resolvePersistenceConfig(environment: PersistenceEnvironment): PersistenceConfig {
  const requested = environment.VIRALIO_PERSISTENCE?.trim().toLowerCase();
  const production = environment.NODE_ENV === "production";

  if (requested && requested !== "json" && requested !== "postgres") {
    throw new Error("VIRALIO_PERSISTENCE must be either json or postgres");
  }

  const kind: PersistenceKind = requested === "postgres" ? "postgres" : requested === "json" ? "json" : production ? "postgres" : "json";

  if (production && kind !== "postgres") {
    throw new Error("Production requires postgres persistence");
  }

  if (kind === "postgres" && !environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for postgres persistence");
  }

  return kind === "postgres"
    ? { kind, databaseUrl: environment.DATABASE_URL }
    : { kind };
}
