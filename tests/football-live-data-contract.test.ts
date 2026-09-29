import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("football live-data delivery contract", () => {
  it("loads scanner data from the dedicated football-data branch with bundled fallback", () => {
    const live = source("src/app/futbol/live-football-data.ts");

    expect(live).toContain(
      "raw.githubusercontent.com/ProtectorRudo/viralio/football-data",
    );
    expect(live).toContain('cache: "no-store"');
    expect(live).toContain('source: "bundled"');
    expect(live).toContain('source: "github"');
    expect(live).toContain("setInterval");
  });

  it("loads upcoming fixtures from the same live branch", () => {
    const upcoming = source("src/app/futbol/live-upcoming-denmark.ts");

    expect(upcoming).toContain(
      "raw.githubusercontent.com/ProtectorRudo/viralio/",
    );
    expect(upcoming).toContain("football-data/src/app/futbol/");
    expect(upcoming).toContain('cache: "no-store"');
    expect(upcoming).toContain("fallbackUpcoming");
  });

  it("prevents Vercel deployments from the football-data branch", () => {
    const config = JSON.parse(source("vercel.json")) as {
      git?: { deploymentEnabled?: Record<string, boolean> };
    };

    expect(config.git?.deploymentEnabled?.["football-data"]).toBe(false);
  });
});
