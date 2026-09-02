import "server-only";
import path from "node:path";
import { JsonRepository } from "./json-repository";
import { resolvePersistenceConfig } from "./persistence-config";
import { PostgresRepository } from "./postgres-repository";
import type { Repository } from "./repository";

const globalRepository = globalThis as typeof globalThis & { viralioRepository?: Repository };

export function createRepository(environment: NodeJS.ProcessEnv = process.env): Repository {
  const config = resolvePersistenceConfig(environment);
  if (config.kind === "postgres") {
    return new PostgresRepository(config.databaseUrl!, { maxConnections: 3 });
  }
  return new JsonRepository(path.join(process.cwd(), "data", "viralio.json"));
}

export const repository = globalRepository.viralioRepository ?? createRepository();

if (process.env.NODE_ENV !== "production") globalRepository.viralioRepository = repository;

export { resolvePersistenceConfig } from "./persistence-config";
export { PostgresRepository } from "./postgres-repository";
