import "server-only";
import path from "node:path";
import { JsonRepository } from "./json-repository";
import { resolvePersistenceConfig } from "./persistence-config";
import { PostgresRepository } from "./postgres-repository";
import type { Repository, TransactionRepository } from "./repository";

const globalRepository = globalThis as typeof globalThis & { viralioRepositoryDelegate?: Repository };

export function createRepository(environment: NodeJS.ProcessEnv = process.env): Repository {
  const config = resolvePersistenceConfig(environment);
  if (config.kind === "postgres") {
    return new PostgresRepository(config.databaseUrl!, { maxConnections: 3 });
  }
  return new JsonRepository(path.join(process.cwd(), "data", "viralio.json"));
}

function inferredKind(environment: NodeJS.ProcessEnv): Repository["kind"] {
  const requested = environment.VIRALIO_PERSISTENCE?.trim().toLowerCase();
  if (requested === "json") return "json";
  if (requested === "postgres") return "postgres";
  return environment.NODE_ENV === "production" ? "postgres" : "json";
}

class DeferredRepository implements Repository {
  readonly kind: Repository["kind"];

  constructor(private readonly environment: NodeJS.ProcessEnv) {
    this.kind = inferredKind(environment);
  }

  async transaction<T>(operation: (transaction: TransactionRepository) => Promise<T>): Promise<T> {
    return this.delegate().transaction(operation);
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.delegate().healthCheck();
    } catch {
      return false;
    }
  }

  private delegate(): Repository {
    if (!globalRepository.viralioRepositoryDelegate) {
      globalRepository.viralioRepositoryDelegate = createRepository(this.environment);
    }
    return globalRepository.viralioRepositoryDelegate;
  }
}

// Keep configuration validation at runtime, not module-evaluation time. Next.js imports
// route modules during `next build`, when deployment secrets may intentionally be absent.
// The first real persistence operation still fails closed if production lacks PostgreSQL.
export const repository: Repository = new DeferredRepository(process.env);

export { resolvePersistenceConfig } from "./persistence-config";
export { PostgresRepository } from "./postgres-repository";
