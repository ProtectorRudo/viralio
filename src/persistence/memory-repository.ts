import type { Database } from "@/domain/types";
import { emptyDatabase, type Repository } from "./repository";

export class MemoryRepository implements Repository {
  database: Database;

  constructor(seed: Database = emptyDatabase()) {
    this.database = structuredClone(seed);
  }

  async transaction<T>(operation: (database: Database) => T | Promise<T>): Promise<T> {
    return operation(this.database);
  }
}
