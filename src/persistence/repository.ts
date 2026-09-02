import type { Database } from "@/domain/types";

export interface Repository {
  transaction<T>(operation: (database: Database) => T | Promise<T>): Promise<T>;
}

export function emptyDatabase(): Database {
  return { sessions: [], rewards: [], events: [] };
}
