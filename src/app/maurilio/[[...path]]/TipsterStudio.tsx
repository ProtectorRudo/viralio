"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./maurilio-fallback.module.css";

type TipsterProfile = {
  id: string;
  slug: string;
  displayName: string;
  headline: string | null;
  sports: string[];
  specialties: string[];
  monthlyPriceArs: number | null;
  isVerified: boolean;
  acceptingSubscribers: boolean;
  status: string;
};

type Account = {
  userId: string;
  role: "user" | "tipster" | "admin";
  displayName: string | null;
  tipster: TipsterProfile | null;
};

type FeedStatus = {
  configured?: boolean;
  provider?: string;
  bookmaker?: string;
  bookmakerKey?: string;
  bookmakerAvailable?: boolean;
};

type FeedEvent = {
  event_id?: string;
  sport?: string;
  league?: string;
  start_time?: number;
  home_team?: string;
  away_team?: string;
};

type EventResponse = {
  bookmaker?: string;
  items?: FeedEvent[];
  count?: number;
};

type OddsLine = {
  selectionKey: string | null;
  market: string;
  selection: string;
  odds: number;
  period: string | null;
};

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function eventTime(value: number | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value * 1000));
}

function collectOdds(node: unknown, lines: OddsLine[], depth = 0) {
  if (depth > 8 || node === null || node === undefined) return;

  if (Array.isArray(node)) {
    for (const item of node) collectOdds(item, lines, depth + 1);
    return;
  }

  if (typeof node !== "object") return;
  const row = node as Record<string, unknown>;

  const rawOdds = row.odds ?? row.price;
  const parsedOdds = Number(rawOdds);

  if (Number.isFinite(parsedOdds) && parsedOdds > 1) {
    const selectionKey =
      typeof row.selection_key === "string" ? row.selection_key : null;
    const selection =
      typeof row.selection_name === "string"
        ? row.selection_name
        : typeof row.selection === "string"
          ? row.selection
          : typeof row.side === "string"
            ? row.side
            : "Selección";
    const market =
      typeof row.market_key === "string"
        ? row.market_key
        : typeof row.bet_type === "string"
          ? row.bet_type
          : typeof row.market === "string"
            ? row.market
            : "Mercado";
    const period =
      typeof row.period_str === "string"
        ? row.period_str
        : typeof row.period === "string"
          ? row.period
          : null;

    lines.push({
      selectionKey,
      market,
      selection,
      odds: parsedOdds,
      period,
    });
  }

  for (const value of Object.values(row)) {
    if (value && typeof value === "object") {
      collectOdds(value, lines, depth + 1);
    }
  }
}

export default function TipsterStudio() {
  const [account, setAccount] = useState<Account | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [feed, setFeed] = useState<FeedStatus | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FeedEvent | null>(null);
  const [odds, setOdds] = useState<OddsLine[]>([]);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [selectedLine, setSelectedLine] = useState<OddsLine | null>(null);
  const [stakeUnits, setStakeUnits] = useState("1");
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [sports, setSports] = useState("Fútbol");
  const [specialties, setSpecialties] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetch("/maurilio/api/account", { cache: "no-store" }),
      fetch("/maurilio/api/bet365?view=status", { cache: "no-store" }),
    ]).then(async ([accountResponse, feedResponse]) => {
      if (!cancelled) {
        if (accountResponse.ok) {
          const data = (await accountResponse.json()) as Account;
          setAccount(data);

          if (data.tipster) {
            setSlug(data.tipster.slug);
            setDisplayName(data.tipster.displayName);
            setHeadline(data.tipster.headline ?? "");
            setSports(data.tipster.sports.join(", "));
            setSpecialties(data.tipster.specialties.join(", "));
            setMonthlyPrice(
              data.tipster.monthlyPriceArs === null
                ? ""
                : String(data.tipster.monthlyPriceArs),
            );
          } else {
            setDisplayName(data.displayName ?? "");
          }
        }

        if (feedResponse.ok) {
          setFeed((await feedResponse.json()) as FeedStatus);
        } else {
          setFeed({ configured: false });
        }

        setAccountLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const canPublish = Boolean(
    account?.role === "tipster" &&
      account.tipster &&
      feed?.configured &&
      feed.bookmakerAvailable,
  );

  const uniqueOdds = useMemo(() => {
    const seen = new Set<string>();
    return odds.filter((line) => {
      const key = [
        line.selectionKey ?? "",
        line.market,
        line.selection,
        line.odds,
      ].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [odds]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch("/maurilio/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        displayName,
        headline,
        sports: splitTags(sports),
        specialties: splitTags(specialties),
        monthlyPriceArs: monthlyPrice ? Number(monthlyPrice) : null,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      setMessage(
        body.error === "slug_taken"
          ? "Ese nombre de perfil ya está ocupado."
          : "No pudimos guardar el perfil.",
      );
      return;
    }

    setMessage("Perfil guardado.");
    window.setTimeout(() => window.location.reload(), 450);
  }

  async function loadEvents() {
    if (!feed?.configured || !feed.bookmakerAvailable) return;
    setEventsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/maurilio/api/bet365?view=events&limit=80",
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("events_failed");
      const body = (await response.json()) as EventResponse;
      setEvents(body.items ?? []);
    } catch {
      setMessage("No pudimos cargar los partidos Bet365.");
    } finally {
      setEventsLoading(false);
    }
  }

  async function loadOdds(event: FeedEvent) {
    if (!event.event_id) return;
    setSelectedEvent(event);
    setOdds([]);
    setSelectedLine(null);
    setOddsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/maurilio/api/bet365?view=odds&event_id=${encodeURIComponent(event.event_id)}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("odds_failed");
      const body = (await response.json()) as Record<string, unknown>;
      const lines: OddsLine[] = [];
      collectOdds(body.snapshot, lines);
      setOdds(lines);
    } catch {
      setMessage("No pudimos cargar las cuotas Bet365 de ese partido.");
    } finally {
      setOddsLoading(false);
    }
  }

  async function publishSelectedTip() {
    if (
      !selectedEvent?.event_id ||
      !selectedLine?.selectionKey ||
      !canPublish ||
      publishing
    ) {
      return;
    }

    const stake = Number(stakeUnits);
    if (!Number.isFinite(stake) || stake <= 0 || stake > 5) {
      setMessage("El stake debe estar entre 0 y 5 unidades.");
      return;
    }

    setPublishing(true);
    setMessage(null);

    try {
      const response = await fetch("/maurilio/api/tips/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.event_id,
          selectionKey: selectedLine.selectionKey,
          stakeUnits: stake,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        tip?: {
          publicId?: string;
          entryOdds?: number | string;
        };
      };

      if (!response.ok) {
        if (body.error === "event_started") {
          setMessage("El partido ya comenzó. Ese tip no se puede publicar.");
        } else if (body.error === "bet365_selection_unavailable") {
          setMessage("La línea ya no está disponible en Bet365.");
        } else if (body.error === "bet365_feed_not_configured") {
          setMessage("El feed Bet365 todavía no está configurado.");
        } else {
          setMessage("No pudimos publicar el tip.");
        }
        return;
      }

      setMessage(
        `Tip publicado y sellado · ${body.tip?.publicId ?? "OK"} · cuota Bet365 @${Number(body.tip?.entryOdds ?? selectedLine.odds).toFixed(2)}`,
      );
      setSelectedLine(null);
    } catch {
      setMessage("No pudimos publicar el tip.");
    } finally {
      setPublishing(false);
    }
  }

  if (accountLoading) {
    return (
      <section className={styles.simpleProductPage}>
        <span>STUDIO TIPSTER</span>
        <h1>Cargando tu cuenta…</h1>
      </section>
    );
  }

  if (!account) {
    return (
      <section className={styles.simpleProductPage}>
        <span>STUDIO TIPSTER</span>
        <h1>Ingresá para publicar.</h1>
        <p>
          El studio sólo está disponible para cuentas registradas como tipster.
        </p>
        <Link className={styles.productPrimaryLink} href="/maurilio/ingresar?tipo=tipster">
          Ingresar o crear cuenta →
        </Link>
      </section>
    );
  }

  if (account.role !== "tipster" && account.role !== "admin") {
    return (
      <section className={styles.simpleProductPage}>
        <span>STUDIO TIPSTER</span>
        <h1>Esta cuenta es de usuario.</h1>
        <p>
          Para publicar picks hace falta una cuenta registrada como tipster.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.tipsterStudio}>
      <div className={styles.studioHero}>
        <span>STUDIO TIPSTER</span>
        <h1>Tu perfil y tus tips.</h1>
        <p>
          Tu historial se construye sólo con publicaciones hechas acá. Una vez
          publicado, el núcleo del tip no se puede editar ni borrar.
        </p>
      </div>

      <div className={styles.studioGrid}>
        <form className={styles.studioCard} onSubmit={saveProfile}>
          <div className={styles.studioCardTitle}>
            <span>01</span>
            <div>
              <b>Perfil público</b>
              <p>Lo que ve una persona antes de suscribirse.</p>
            </div>
          </div>

          <label>
            <span>Nombre</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>
          <label>
            <span>URL del perfil</span>
            <div className={styles.slugField}>
              <small>maurilio/tipsters/</small>
              <input
                value={slug}
                onChange={(event) => setSlug(event.target.value.toLowerCase())}
                placeholder="tu-nombre"
                required
              />
            </div>
          </label>
          <label>
            <span>Descripción corta</span>
            <input
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              maxLength={120}
              placeholder="Ej. Fútbol argentino y tarjetas"
            />
          </label>
          <label>
            <span>Deportes · separados por coma</span>
            <input
              value={sports}
              onChange={(event) => setSports(event.target.value)}
            />
          </label>
          <label>
            <span>Especialidades · separadas por coma</span>
            <input
              value={specialties}
              onChange={(event) => setSpecialties(event.target.value)}
              placeholder="Tarjetas, Goles, Primera División"
            />
          </label>
          <label>
            <span>Precio mensual ARS</span>
            <input
              value={monthlyPrice}
              onChange={(event) => setMonthlyPrice(event.target.value)}
              type="number"
              min="0"
              step="100"
              placeholder="15000"
            />
          </label>

          <button type="submit">Guardar perfil</button>
        </form>

        <div className={styles.studioCard}>
          <div className={styles.studioCardTitle}>
            <span>02</span>
            <div>
              <b>Fuente de cuotas</b>
              <p>Obligatoria para publicar tips verificables.</p>
            </div>
          </div>

          <div className={styles.feedStatus}>
            <i className={feed?.configured && feed.bookmakerAvailable ? styles.feedOnline : undefined} />
            <div>
              <b>Bet365</b>
              <span>
                {!feed?.configured
                  ? "Feed pendiente de API key"
                  : feed.bookmakerAvailable
                    ? "Feed disponible"
                    : "Bet365 no disponible en el feed configurado"}
              </span>
            </div>
          </div>

          <p className={styles.studioHelp}>
            No se aceptan cuotas cargadas manualmente. El precio de entrada debe
            venir del feed Bet365 y queda guardado con timestamp.
          </p>

          <button
            type="button"
            className={styles.studioSecondary}
            onClick={loadEvents}
            disabled={!feed?.configured || !feed.bookmakerAvailable || eventsLoading}
          >
            {eventsLoading ? "Cargando…" : "Ver partidos Bet365"}
          </button>
        </div>
      </div>

      {events.length > 0 ? (
        <section className={styles.eventPicker}>
          <div className={styles.tipsterSectionTitle}>
            <div>
              <span>BET365 · PRÓXIMOS EVENTOS</span>
              <h2>Elegí un partido.</h2>
            </div>
            <p>Al elegirlo cargamos sus mercados y precios actuales.</p>
          </div>

          <div className={styles.eventList}>
            {events.map((event, index) => (
              <button
                type="button"
                key={event.event_id ?? String(index)}
                onClick={() => loadOdds(event)}
              >
                <div>
                  <span>{event.league ?? event.sport ?? "Evento"}</span>
                  <b>
                    {event.home_team ?? "Local"} vs {event.away_team ?? "Visitante"}
                  </b>
                </div>
                <small>{eventTime(event.start_time)}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedEvent ? (
        <section className={styles.eventPicker}>
          <div className={styles.tipsterSectionTitle}>
            <div>
              <span>CUOTAS BET365</span>
              <h2>
                {selectedEvent.home_team ?? "Local"} vs{" "}
                {selectedEvent.away_team ?? "Visitante"}
              </h2>
            </div>
            <p>
              {oddsLoading
                ? "Cargando precios…"
                : `${uniqueOdds.length} líneas detectadas`}
            </p>
          </div>

          {uniqueOdds.length > 0 ? (
            <>
              <div className={styles.publishBar}>
                <div>
                  <span>SELECCIÓN</span>
                  <b>
                    {selectedLine
                      ? `${selectedLine.selection} @${selectedLine.odds.toFixed(2)}`
                      : "Elegí una cuota Bet365"}
                  </b>
                </div>
                <label>
                  <span>STAKE</span>
                  <input
                    value={stakeUnits}
                    onChange={(event) => setStakeUnits(event.target.value)}
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                  />
                </label>
                <button
                  type="button"
                  disabled={
                    !canPublish ||
                    !selectedLine?.selectionKey ||
                    publishing
                  }
                  onClick={publishSelectedTip}
                >
                  {publishing ? "Validando Bet365…" : "Publicar tip"}
                </button>
              </div>

              <div className={styles.oddsList}>
                {uniqueOdds.slice(0, 120).map((line, index) => {
                  const selected =
                    Boolean(selectedLine) &&
                    selectedLine?.selectionKey === line.selectionKey &&
                    selectedLine?.market === line.market &&
                    selectedLine?.selection === line.selection &&
                    selectedLine?.odds === line.odds;

                  return (
                    <button
                      type="button"
                      key={`${line.selectionKey ?? "line"}-${index}`}
                      disabled={!canPublish || !line.selectionKey}
                      className={selected ? styles.oddsLineSelected : undefined}
                      onClick={() => setSelectedLine(line)}
                    >
                      <div>
                        <span>
                          {line.market}
                          {line.period ? ` · ${line.period}` : ""}
                        </span>
                        <b>{line.selection}</b>
                      </div>
                      <strong>@{line.odds.toFixed(2)}</strong>
                    </button>
                  );
                })}
              </div>
            </>
          ) : !oddsLoading ? (
            <div className={styles.tipsterEmpty}>
              <b>No encontramos líneas utilizables.</b>
              <p>Puede que Bet365 todavía no haya publicado mercados para este evento.</p>
            </div>
          ) : null}

          {!canPublish ? (
            <p className={styles.studioHelp}>
              Para publicar necesitás perfil creado y feed Bet365 operativo.
            </p>
          ) : null}
        </section>
      ) : null}

      {message ? <p className={styles.studioMessage}>{message}</p> : null}
    </section>
  );
}
