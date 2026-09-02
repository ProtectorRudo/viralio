import type { Database } from "@/domain/types";
import { ArrayTransaction } from "./array-transaction";
import { emptyDatabase, type Repository } from "./repository";

export class MemoryRepository implements Repository {
  readonly kind = "memory" as const;
  database: Database;
  private queue: Promise<void> = Promise.resolve();

  constructor(seed: Database = emptyDatabase()) {
    this.database = structuredClone(seed);
  }

  async transaction<T>(operation: (transaction: ArrayTransaction) => Promise<T>): Promise<T> {
    let release!: () => void;
    const previous = this.queue;
    this.queue = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      const workingCopy = structuredClone(this.database);
      const result = await operation(new ArrayTransaction(workingCopy));
      this.database = workingCopy;
      return result;
    } finally {
      release();
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
