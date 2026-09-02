import "server-only";
import path from "node:path";
import { JsonRepository } from "./json-repository";

const globalRepository = globalThis as typeof globalThis & { viralioRepository?: JsonRepository };

export const repository = globalRepository.viralioRepository ??
  new JsonRepository(path.join(process.cwd(), "data", "viralio.json"));

if (process.env.NODE_ENV !== "production") globalRepository.viralioRepository = repository;
