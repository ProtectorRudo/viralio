"use client";

import { useEffect, useMemo, useState } from "react";
import type { StockMindAnalysis } from "@/acciones/stockmind";
import {
  applyReviewToThesis,
  createThesisFromAnalysis,
  evaluateThesis,
  type SavedThesis,
  type ThesisAction,
} from "@/acciones/thesis";
import styles from "./workspace.module.css";

type WorkspaceTab = "radar" | "watchlist" | "theses";

type RadarResponse = {
  items?: StockMindAnalysis[];
  asOf?: string;
  error?: string;
};

const WATCHLIST_KEY = "stockmind.watchlist.v1";
const THESES_KEY = "stockmind.theses.v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatMoney(value: number | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function actionLabel(action?: ThesisAction) {
  if (action === "REVIEW_EXIT") return "Revisar salida";
  if (action === "REVIEW") return "Revisar";
  if (action === "HOLD") return "Tesis vigente";
  return "Sin actualizar";
}

function actionClass(action?: ThesisAction) {
  if (action === "REVIEW_EXIT") return styles.actionExit;
  if (action === "REVIEW") return styles.actionReview;
  if (action === "HOLD") return styles.actionHold;
  return styles.actionPending;
}

export default function StockMindWorkspace({
  analysis,
  onAnalyze,
  disabled = false,
}: {
  analysis: StockMindAnalysis | null;
  onAnalyze: (ticker: string) => void;
  disabled?: boolean;
}) {
  const [tab, setTab] = useState<WorkspaceTab>("radar");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [theses, setTheses] = useState<SavedThesis[]>([]);
  const [radar, setRadar] = useState<StockMindAnalysis[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWatchlist(readJson<string[]>(WATCHLIST_KEY, []));
    setTheses(readJson<SavedThesis[]>(THESES_KEY, []));
    setHydrated(true);
  }, []);

  function persistWatchlist(next: string[]) {
    const clean = [...new Set(next.map((ticker) => ticker.toUpperCase()))].sort();
    setWatchlist(clean);
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(clean));
  }

  function persistTheses(next: SavedThesis[]) {
    const clean = [...next].sort((a, b) => a.ticker.localeCompare(b.ticker));
    setTheses(clean);
    window.localStorage.setItem(THESES_KEY, JSON.stringify(clean));
  }

  const currentInWatchlist =
    analysis != null && watchlist.includes(analysis.ticker.toUpperCase());

  const currentThesis = useMemo(
    () =>
      analysis
        ? theses.find((item) => item.ticker === analysis.ticker.toUpperCase()) ?? null
        : null,
    [analysis, theses],
  );

  const currentReview = useMemo(
    () => (analysis && currentThesis ? evaluateThesis(currentThesis, analysis) : null),
    [analysis, currentThesis],
  );

  function toggleWatchlist() {
    if (!analysis) return;
    const ticker = analysis.ticker.toUpperCase();
    if (watchlist.includes(ticker)) {
      persistWatchlist(watchlist.filter((item) => item !== ticker));
      setNotice(`${ticker} salió de favoritos.`);
    } else {
      persistWatchlist([...watchlist, ticker]);
      setNotice(`${ticker} agregado a favoritos.`);
    }
  }

  function saveThesis() {
    if (!analysis) return;
    try {
      const next = createThesisFromAnalysis(analysis);
      const withoutTicker = theses.filter((item) => item.ticker !== next.ticker);
      persistTheses([...withoutTicker, next]);
      setNotice(`Tesis de ${next.ticker} guardada con precio de entrada ${formatMoney(next.entryPrice)}.`);
      setTab("theses");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar la tesis.");
    }
  }

  async function loadRadar() {
    if (radarLoading) return;
    setRadarLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/acciones/radar?limit=6", { cache: "no-store" });
      const payload = (await response.json()) as RadarResponse;
      if (!response.ok || !Array.isArray(payload.items)) {
        throw new Error(payload.error || "No se pudo construir el radar.");
      }
      setRadar(payload.items);
      setNotice(
        payload.items.length
          ? `Radar actualizado: ${payload.items.length} oportunidades comparadas.`
          : "El radar no encontró resultados utilizables.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo construir el radar.");
    } finally {
      setRadarLoading(false);
    }
  }

  async function refreshTheses() {
    if (!theses.length || monitorLoading) return;
    setMonitorLoading(true);
    setNotice("");

    const next = await Promise.all(
      theses.map(async (thesis) => {
        try {
          const response = await fetch(
            `/api/acciones/analyze?ticker=${encodeURIComponent(thesis.ticker)}`,
            { cache: "no-store" },
          );
          const payload = (await response.json()) as StockMindAnalysis | { error?: string };
          if (!response.ok || !("ticker" in payload)) return thesis;
          const review = evaluateThesis(thesis, payload);
          return applyReviewToThesis(thesis, payload, review);
        } catch {
          return thesis;
        }
      }),
    );

    persistTheses(next);
    setNotice("Seguimiento actualizado con la evidencia más reciente disponible.");
    setMonitorLoading(false);
  }

  function removeThesis(ticker: string) {
    persistTheses(theses.filter((item) => item.ticker !== ticker));
    setNotice(`Tesis de ${ticker} eliminada.`);
  }

  if (!hydrated) {
    return <section className={styles.workspaceSkeleton} aria-hidden="true" />;
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.workspaceHead}>
        <div>
          <span className={styles.eyebrow}>Workspace</span>
          <h2>Radar y seguimiento</h2>
        </div>

        {analysis ? (
          <div className={styles.currentActions}>
            <button type="button" onClick={toggleWatchlist} disabled={disabled}>
              {currentInWatchlist ? "★ En favoritos" : "☆ Agregar favorito"}
            </button>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={saveThesis}
              disabled={disabled}
            >
              {currentThesis ? "Actualizar tesis" : "Guardar tesis"}
            </button>
          </div>
        ) : null}
      </div>

      {analysis && currentReview ? (
        <div className={styles.currentReview}>
          <span className={actionClass(currentReview.action)}>
            {actionLabel(currentReview.action)}
          </span>
          <p>{currentReview.summary}</p>
          <small>
            Desde entrada: {formatPercent(currentReview.priceReturn)} · salud{" "}
            {Math.round(currentReview.health)}/100
          </small>
        </div>
      ) : null}

      <div className={styles.tabs} role="tablist" aria-label="Herramientas StockMind">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "radar"}
          className={tab === "radar" ? styles.activeTab : ""}
          onClick={() => setTab("radar")}
        >
          Radar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "watchlist"}
          className={tab === "watchlist" ? styles.activeTab : ""}
          onClick={() => setTab("watchlist")}
        >
          Favoritos <span>{watchlist.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "theses"}
          className={tab === "theses" ? styles.activeTab : ""}
          onClick={() => setTab("theses")}
        >
          Tesis <span>{theses.length}</span>
        </button>
      </div>

      {notice ? <p className={styles.notice}>{notice}</p> : null}

      {tab === "radar" ? (
        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h3>Oportunidades detectadas</h3>
              <p>
                Screeners de mercado → análisis StockMind → ranking por evidencia,
                confianza y régimen.
              </p>
            </div>
            <button
              type="button"
              className={styles.runButton}
              onClick={() => void loadRadar()}
              disabled={radarLoading || disabled}
            >
              {radarLoading ? "Escaneando…" : radar.length ? "Actualizar radar" : "Explorar mercado"}
            </button>
          </div>

          {radar.length ? (
            <div className={styles.radarGrid}>
              {radar.map((item, index) => (
                <article key={item.ticker} className={styles.radarCard}>
                  <div className={styles.rank}>#{index + 1}</div>
                  <div className={styles.radarTop}>
                    <div>
                      <strong>{item.ticker}</strong>
                      <span>{item.companyName}</span>
                    </div>
                    <div className={styles.radarScore}>{Math.round(item.compositeScore)}</div>
                  </div>
                  <div className={styles.radarMeta}>
                    <span>{item.signalLabel}</span>
                    <span>Conf. {Math.round(item.confidence * 100)}%</span>
                  </div>
                  <p>
                    {item.reasons[0] ||
                      item.engines.find((engine) => engine.name === "Fundamental")?.summary ||
                      "Análisis disponible."}
                  </p>
                  <button
                    type="button"
                    onClick={() => onAnalyze(item.ticker)}
                    disabled={disabled}
                  >
                    Abrir análisis
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.blankState}>
              <strong>El Radar todavía no corrió.</strong>
              <p>
                StockMind compara candidatos de varios screeners y sólo después los
                ordena con sus propios motores.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {tab === "watchlist" ? (
        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h3>Favoritos</h3>
              <p>Una lista rápida de empresas que querés tener a mano.</p>
            </div>
          </div>

          {watchlist.length ? (
            <div className={styles.watchList}>
              {watchlist.map((ticker) => (
                <div key={ticker} className={styles.watchRow}>
                  <strong>{ticker}</strong>
                  <div>
                    <button
                      type="button"
                      onClick={() => onAnalyze(ticker)}
                      disabled={disabled}
                    >
                      Analizar
                    </button>
                    <button
                      type="button"
                      className={styles.ghostDanger}
                      onClick={() =>
                        persistWatchlist(watchlist.filter((item) => item !== ticker))
                      }
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.blankState}>
              <strong>No tenés favoritos todavía.</strong>
              <p>Analizá una acción y tocá “Agregar favorito”.</p>
            </div>
          )}
        </div>
      ) : null}

      {tab === "theses" ? (
        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h3>Monitor de tesis</h3>
              <p>
                Compara el negocio de hoy contra el momento en que decidiste seguirlo.
              </p>
            </div>
            <button
              type="button"
              className={styles.runButton}
              onClick={() => void refreshTheses()}
              disabled={!theses.length || monitorLoading || disabled}
            >
              {monitorLoading ? "Actualizando…" : "Actualizar seguimiento"}
            </button>
          </div>

          {theses.length ? (
            <div className={styles.thesisList}>
              {theses.map((thesis) => (
                <article key={thesis.ticker} className={styles.thesisRow}>
                  <div className={styles.thesisIdentity}>
                    <strong>{thesis.ticker}</strong>
                    <span>{thesis.companyName}</span>
                  </div>
                  <div className={styles.thesisNumbers}>
                    <span>Entrada {formatMoney(thesis.entryPrice)}</span>
                    <span>
                      {thesis.lastPrice != null
                        ? `Último ${formatMoney(thesis.lastPrice)}`
                        : `Score inicial ${Math.round(thesis.compositeScore)}`}
                    </span>
                    {thesis.lastReturn != null ? (
                      <span>Retorno {formatPercent(thesis.lastReturn)}</span>
                    ) : null}
                  </div>
                  <div className={styles.thesisStatus}>
                    <span className={actionClass(thesis.lastAction)}>
                      {actionLabel(thesis.lastAction)}
                    </span>
                    <p>
                      {thesis.lastSummary ||
                        "Guardada. Actualizá el seguimiento para comparar la tesis."}
                    </p>
                  </div>
                  <div className={styles.thesisActions}>
                    <button
                      type="button"
                      onClick={() => onAnalyze(thesis.ticker)}
                      disabled={disabled}
                    >
                      Abrir
                    </button>
                    <button
                      type="button"
                      className={styles.ghostDanger}
                      onClick={() => removeThesis(thesis.ticker)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.blankState}>
              <strong>No hay tesis guardadas.</strong>
              <p>
                Cuando una empresa te interese, guardá su foto actual y StockMind la
                usará como línea de base.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <p className={styles.storageNote}>
        Favoritos y tesis se guardan sólo en este navegador. No se mezclan con los
        datos comerciales de Viralio.
      </p>
    </section>
  );
}
