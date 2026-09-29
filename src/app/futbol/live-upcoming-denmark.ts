"use client";

import { useEffect, useState } from "react";

import fallbackUpcoming from "./upcoming-denmark-271.json";

const LIVE_URL =
  "https://raw.githubusercontent.com/ProtectorRudo/viralio/" +
  "football-data/src/app/futbol/upcoming-denmark-271.json";
const REFRESH_MS = 5 * 60 * 1000;

type UpcomingFixture = {
  fixture_id: number;
  kickoff_at: string;
  home_team: string;
  away_team: string;
};

type UpcomingSnapshot = {
  generated_at: string;
  league_id: number;
  fixtures: UpcomingFixture[];
};

export function useLiveUpcomingDenmark() {
  const [snapshot, setSnapshot] = useState<UpcomingSnapshot>(
    fallbackUpcoming as UpcomingSnapshot,
  );

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;

    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();

      try {
        const response = await fetch(`${LIVE_URL}?t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const next = (await response.json()) as UpcomingSnapshot;
        if (mounted && Array.isArray(next.fixtures)) {
          setSnapshot(next);
        }
      } catch {
        // Bundled data remains active when GitHub is temporarily unavailable.
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, REFRESH_MS);

    return () => {
      mounted = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, []);

  return snapshot;
}
