/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminCall, SESSION_KEY } from "./api";
import { experiences } from "../data";

type GiftRow = {
  public_code: string;
  status: string;
  experience_slug: string;
  giver_name: string;
  recipient_name: string;
  created_at: string;
  published_at: string | null;
  story_data?: { creator?: { submitted?: boolean; submittedAt?: string } } | null;
};

export default function AdminPortal() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [loginError, setLoginError] = useState("");
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function loadGifts() {
    setLoading(true);
    try {
      const data = await adminCall<{ gifts: GiftRow[] }>("listGifts");
      setGifts(data.gifts || []);
      setLoggedIn(true);
    } catch {
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hasSession = Boolean(window.sessionStorage.getItem(SESSION_KEY));
    setLoggedIn(hasSession);
    setSessionReady(true);
    if (hasSession) loadGifts();

    const expire = () => setLoggedIn(false);
    window.addEventListener("thi-admin-session-expired", expire);
    return () => window.removeEventListener("thi-admin-session-expired", expire);
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const data = await adminCall<{ token: string; expiresAt: string }>(
        "login",
        { accessKey },
        false,
      );
      window.sessionStorage.setItem(SESSION_KEY, data.token);
      setAccessKey("");
      setLoggedIn(true);
      await loadGifts();
    } catch {
      setLoginError("Clave incorrecta.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await adminCall("logout");
    } catch {}
    window.sessionStorage.removeItem(SESSION_KEY);
    setLoggedIn(false);
    setGifts([]);
  }

  const publishedCount = gifts.filter((gift) => gift.status === "published").length;
  const draftCount = gifts.filter((gift) => gift.status === "draft").length;
  const creatorLeadCount = gifts.filter((gift) => gift.story_data?.creator?.submitted).length;

  async function createGift(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);

    try {
      const data = await adminCall<{ code: string }>("createGift", {
        experienceSlug: String(form.get("experienceSlug") || ""),
        giverName: String(form.get("giverName") || ""),
        recipientName: String(form.get("recipientName") || ""),
        occasion: String(form.get("occasion") || ""),
        feeling: String(form.get("feeling") || ""),
      });

      router.push(`/tehiceesto/admin/${data.code}`);
    } finally {
      setLoading(false);
    }
  }

  if (!sessionReady) {
    return <main className="thi-admin-shell"><div className="thi-admin-loading">Cargando…</div></main>;
  }

  if (!loggedIn) {
    return (
      <main className="thi-admin-shell thi-admin-login-shell">
        <section className="thi-admin-login-card thi-admin-login-premium">
          <div className="thi-admin-login-orbit orbit-a" aria-hidden="true"/>
          <div className="thi-admin-login-orbit orbit-b" aria-hidden="true"/>
          <div className="thi-admin-lockmark" aria-hidden="true"><span>◇</span><i/></div>
          <Link href="/tehiceesto" className="thi-admin-back">← Te Hice Esto</Link>
          <p className="thi-kicker">Panel interno</p>
          <h1>Armado de regalos</h1>
          <p>
            Acceso privado para crear, revisar y publicar experiencias.
          </p>

          <form onSubmit={login}>
            <label>
              <span>Clave de acceso</span>
              <input
                type="password"
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                autoFocus
                required
              />
            </label>
            {loginError && <small className="thi-admin-error">{loginError}</small>}
            <button className="thi-primary" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="thi-admin-shell">
      <header className="thi-admin-header thi-admin-header-premium">
        <div className="thi-admin-header-aura" aria-hidden="true"/>
        <div>
          <Link href="/tehiceesto" className="thi-admin-back">← Te Hice Esto</Link>
          <p className="thi-kicker">Operación</p>
          <h1>Regalos</h1>
        </div>

        <div className="thi-admin-header-actions">
          <button className="thi-primary" onClick={() => setShowNew(true)}>
            + Nuevo regalo
          </button>
          <button className="thi-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="thi-admin-stat-grid">
        <article><span>Total</span><strong>{gifts.length}</strong><small>regalos creados</small></article>
        <article><span>Publicados</span><strong>{publishedCount}</strong><small>links activos</small></article>
        <article><span>Borradores</span><strong>{draftCount}</strong><small>en preparación</small></article>
        <article className="accent"><span>Desde la web</span><strong>{creatorLeadCount}</strong><small>borradores enviados por clientes</small></article>
      </section>

      {showNew && (
        <section className="thi-admin-panel thi-admin-new-panel">
          <div className="thi-admin-panel-heading">
            <div>
              <p className="thi-kicker">Nuevo</p>
              <h2>Crear borrador</h2>
            </div>
            <button className="thi-ghost" onClick={() => setShowNew(false)}>Cerrar</button>
          </div>

          <form className="thi-admin-form" onSubmit={createGift}>
            <label>
              <span>Experiencia</span>
              <select name="experienceSlug" defaultValue="pareja">
                {experiences.map((experience) => (
                  <option value={experience.slug} key={experience.slug}>
                    {experience.icon} {experience.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Quién regala</span>
              <input name="giverName" required placeholder="Ej. Mauro" />
            </label>

            <label>
              <span>Quién recibe</span>
              <input name="recipientName" required placeholder="Ej. Ailín" />
            </label>

            <label>
              <span>Ocasión</span>
              <input name="occasion" placeholder="Ej. aniversario 8 años" />
            </label>

            <label className="wide">
              <span>Emoción</span>
              <select name="feeling" defaultValue="Emoción">
                <option>Emoción</option>
                <option>Amor</option>
                <option>Sorpresa</option>
                <option>Diversión</option>
                <option>Nostalgia</option>
              </select>
            </label>

            <div className="wide thi-admin-form-actions">
              <button className="thi-primary" disabled={loading}>
                {loading ? "Creando…" : "Crear borrador →"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="thi-admin-panel">
        <div className="thi-admin-panel-heading">
          <div>
            <p className="thi-kicker">Actividad</p>
            <h2>Últimos regalos</h2>
          </div>
          <button className="thi-ghost" onClick={loadGifts} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>

        {gifts.length === 0 ? (
          <div className="thi-admin-empty">
            <strong>Todavía no hay regalos.</strong>
            <p>El primero que creemos va a aparecer acá.</p>
          </div>
        ) : (
          <div className="thi-admin-table-wrap">
            <table className="thi-admin-table">
              <thead>
                <tr>
                  <th>Destinatario</th>
                  <th>De</th>
                  <th>Experiencia</th>
                  <th>Origen</th>
                  <th>Estado</th>
                  <th>Código</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((gift) => (
                  <tr key={gift.public_code}>
                    <td>
                      <Link href={`/tehiceesto/admin/${gift.public_code}`} className="thi-admin-gift-link">
                        <strong>{gift.recipient_name}</strong>
                        <span>Editar →</span>
                      </Link>
                    </td>
                    <td>{gift.giver_name}</td>
                    <td>{gift.experience_slug}</td>
                    <td>
                      <span className={gift.story_data?.creator?.submitted ? "thi-source-badge creator" : "thi-source-badge manual"}>
                        {gift.story_data?.creator?.submitted ? "Web" : "Manual"}
                      </span>
                    </td>
                    <td>
                      <span className={`thi-status ${gift.status}`}>
                        {gift.status}
                      </span>
                    </td>
                    <td><code>{gift.public_code}</code></td>
                    <td>{new Date(gift.created_at).toLocaleDateString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
