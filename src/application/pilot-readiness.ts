import "server-only";
import { DEFAULT_OPENAI_BRAND_MODEL } from "@/ai/openai-brand";
import type { Repository } from "@/persistence/repository";
import { createMerchantSessionToken } from "@/security/merchant-auth";

export interface PilotReadiness {
  repository: Repository["kind"];
  database: boolean;
  auth: boolean;
  onboarding: boolean;
  brandAi: boolean;
  brandModel: string;
  pilotReady: boolean;
}

const MODEL = /^[A-Za-z0-9._-]{2,80}$/;

function authReady(environment: NodeJS.ProcessEnv): boolean {
  try {
    createMerchantSessionToken("readiness-check", 0, environment);
    return true;
  } catch {
    return false;
  }
}

function brandAiReady(environment: NodeJS.ProcessEnv): { configured: boolean; model: string } {
  const requestedModel = environment.OPENAI_BRAND_MODEL?.trim() || DEFAULT_OPENAI_BRAND_MODEL;
  const validModel = MODEL.test(requestedModel);
  const key = environment.OPENAI_API_KEY?.trim() ?? "";
  return {
    configured: validModel && key.length >= 20,
    model: validModel ? requestedModel : DEFAULT_OPENAI_BRAND_MODEL,
  };
}

export async function evaluatePilotReadiness(
  repository: Repository,
  environment: NodeJS.ProcessEnv = process.env,
  onboarding = true,
): Promise<PilotReadiness> {
  const database = repository.kind === "postgres" && await repository.healthCheck();
  const auth = authReady(environment);
  const brand = brandAiReady(environment);
  const pilotReady = database && auth && onboarding && brand.configured;

  return {
    repository: repository.kind,
    database,
    auth,
    onboarding,
    brandAi: brand.configured,
    brandModel: brand.model,
    pilotReady,
  };
}
