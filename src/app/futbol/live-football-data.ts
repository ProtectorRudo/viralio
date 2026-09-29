"use client";

import { useEffect, useState } from "react";

import denmarkSignals from "./upcoming-denmark-271-signals.json";
import scotlandSignals from "./free-scotland-501-signals.json";
import denmarkHistory from "./free-denmark-271-signal-history.json";
import scotlandHistory from "./free-scotland-501-signal-history.json";
import denmarkPerformance from "./free-denmark-271-performance.json";
import scotlandPerformance from "./free-scotland-501-performance.json";
import denmarkStrategyAudit from "./free-denmark-271-strategy-audit.json";
import scotlandStrategyAudit from "./free-scotland-501-strategy-audit.json";
import denmarkCalibration from "./free-denmark-271-calibration.json";
import scotlandCalibration from "./free-scotland-501-calibration.json";
import denmarkStability from "./free-denmark-271-stability.json";
import scotlandStability from "./free-scotland-501-stability.json";

const RAW_BASE =
  "https://raw.githubusercontent.com/ProtectorRudo/viralio/main/src/app/futbol";

const REFRESH_MS = 5 * 60 * 1000;

type LeagueData = {
  signals: unknown;
  history: unknown;
  performance: unknown;
  strategyAudit: unknown;
  calibration: unknown;
  stability: unknown;
};

type LiveFootballData = {
  denmark: LeagueData;
  scotland: LeagueData;
  source: "bundled" | "github";
  refreshedAt: string | null;
};

const FALLBACK: LiveFootballData = {
  denmark: {
    signals: denmarkSignals,
    history: denmarkHistory,
    performance: denmarkPerformance,
    strategyAudit: denmarkStrategyAudit,
    calibration: denmarkCalibration,
    stability: denmarkStability,
  },
  scotland: {
    signals: scotlandSignals,
    history: scotlandHistory,
    performance: scotlandPerformance,
    strategyAudit: scotlandStrategyAudit,
    calibration: scotlandCalibration,
    stability: scotlandStability,
  },
  source: "bundled",
  refreshedAt: null,
};

const FILES = {
  denmark: {
    signals: "upcoming-denmark-271-signals.json",
    history: "free-denmark-271-signal-history.json",
    performance: "free-denmark-271-performance.json",
    strategyAudit: "free-denmark-271-strategy-audit.json",
    calibration: "free-denmark-271-calibration.json",
    stability: "free-denmark-271-stability.json",
  },
  scotland: {
    signals: "free-scotland-501-signals.json",
    history: "free-scotland-501-signal-history.json",
    performance: "free-scotland-501-performance.json",
    strategyAudit: "free-scotland-501-strategy-audit.json",
    calibration: "free-scotland-501-calibration.json",
    stability: "free-scotland-501-stability.json",
  },
} as const;

async function fetchJson(file: string, signal: AbortSignal) {
  const response = await fetch(`${RAW_BASE}/${file}?t=${Date.now()}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(`football data fetch failed: ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

async function fetchLeague(
  files: (typeof FILES)[keyof typeof FILES],
  signal: AbortSignal,
): Promise<LeagueData> {
  const [
    signals,
    history,
    performance,
    strategyAudit,
    calibration,
    stability,
  ] = await Promise.all([
    fetchJson(files.signals, signal),
    fetchJson(files.history, signal),
    fetchJson(files.performance, signal),
    fetchJson(files.strategyAudit, signal),
    fetchJson(files.calibration, signal),
    fetchJson(files.stability, signal),
  ]);

  return {
    signals,
    history,
    performance,
    strategyAudit,
    calibration,
    stability,
  };
}

export function useLiveFootballData() {
  const [data, setData] = useState<LiveFootballData>(FALLBACK);

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;

    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();

      try {
        const [denmark, scotland] = await Promise.all([
          fetchLeague(FILES.denmark, controller.signal),
          fetchLeague(FILES.scotland, controller.signal),
        ]);

        if (!mounted) return;
        setData({
          denmark,
          scotland,
          source: "github",
          refreshedAt: new Date().toISOString(),
        });
      } catch (error) {
        if (!mounted || controller.signal.aborted) return;
        console.warn("Using bundled football data fallback", error);
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

  return data;
}
