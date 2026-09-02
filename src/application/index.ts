import "server-only";
import { repository } from "@/persistence";
import { ViralioService } from "./viralio-service";

export const viralio = new ViralioService(repository);
