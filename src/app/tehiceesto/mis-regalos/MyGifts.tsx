"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getExperience } from "../data";
import { creatorCall } from "../creatorApi";
import { ACCOUNT_TOKEN_KEY, giftAccountCall, requestGiftAccountLink } from "../giftAccountApi";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../creatorApi";

type GiftRow = {
  templateVersion?: string;
  code: string;
  status: string;
  experienceSlug: string;
  recipientName: string;
  publishedAt: string | null;
};

type AccountGift = GiftRow & {
  giverName: string;
  purchasedAt: string;
};
type AccountListPayload = { email: string; gifts: AccountGift[] };
type AccountOpenPayload = { ok: boolean; editorToken: string; code: string };
type StudioOpenPayload = {
  gift: {
    status: string;
    experience_slug: string;
    recipient_name: string;
    published_at: string | null;
  };
};
type Screen = "loading" | "login" | "account";
type EmailState = "idle" | "sending" | "sent" | "error";

function publicPath(route: string) {
  if (typeof window !== "undefined" && window.location.hostname.endsWith("tehiceesto.com")) return route;
  return "/tehiceesto" + route;
}
function editorAccessKey(code: string) { return "thi_editor_access:" + code; }
function validCode(code: string) { return /^[a-f0-9]{18}$/.test(code); }

function clearAuthResponseFromUrl() {
  const url = new URL(window.location.href);
  const keepGift = url.searchParams.get("regalo");
  url.hash = "";
  url.search = "";
  if (keepGift) url.searchParams.set("regalo", keepGift);
  window.history.replaceState({}, document.title, url.pathname + url.search);
}

async function readMagicLinkToken(): Promise<string> {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const tokenHash = hash.get("token_hash");
  if (!tokenHash) return "";
  // Never leave a one-time credential in browser history.
  clearAuthResponseFromUrl();
  if (!/^[a-f0-9]{32,128}$/i.test(tokenHash)) throw new Error("invalid_access_link");
  const response = await fetch(SUPABASE_URL + "/auth/v1/verify", {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "content-type": "application/json" },
    body: JSON.stringify({ token_hash: tokenHash, type: "magiclink" }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("expired_access_link");
  }
  return data.access_token;
}

// Retain support for gifts edited on this device before accounts were available.
async function localSavedGifts(): Promise<GiftRow[]> {
  const keys = Object.keys(window.localStorage).filter(key => key.startsWith("thi_editor_access:"));
  const entries = keys.map(key => ({
    code: key.slice("thi_editor_access:".length),
    token: window.localStorage.getItem(key) || "",
  })).filter(entry => validCode(entry.code) && entry.token);
  const found = await Promise.all(entries.map(async entry => {
    try {
      const data = await creatorCall<StudioOpenPayload>("openStudio", {
        code: entry.code, editorToken: entry.token,
      });
      return {
        code: entry.code,
        status: data.gift.status,
        experienceSlug: data.gift.experience_slug,
        recipientName: data.gift.recipient_name,
        publishedAt: data.gift.published_at,
      } as GiftRow;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (reason === "studio_unauthorized" || reason === "studio_not_found") {
        window.localStorage.removeItem(editorAccessKey(entry.code));
      }
      return null;
    }
  }));
  return found.filter((gift): gift is GiftRow => gift !== null);
}

export default function MyGifts() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [localGifts, setLocalGifts] = useState<GiftRow[]>([]);
  const [accountEmail, setAccountEmail] = useState("");
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const [accessError, setAccessError] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [openingCode, setOpeningCode] = useState("");
  const [openingError, setOpeningError] = useState("");

  useEffect(() => {
    let active = true;
    const run = async () => {
      const requestedCode = new URLSearchParams(window.location.search).get("regalo")?.trim().toLowerCase() || "";
      const urlHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hasMagicLink = urlHash.has("token_hash");
      const urlAccessToken = urlHash.get("access_token") ||
        new URLSearchParams(window.location.search).get("access_token") || "";

      let callbackToken = urlAccessToken;
      if (hasMagicLink) {
        try {
          callbackToken = await readMagicLinkToken();
        } catch {
          if (active) setAccessError(true);
          callbackToken = "";
        }
      }
      if (callbackToken) {
        window.localStorage.setItem(ACCOUNT_TOKEN_KEY, callbackToken);
        if (!hasMagicLink) clearAuthResponseFromUrl();
      }

      const accessToken = callbackToken || window.localStorage.getItem(ACCOUNT_TOKEN_KEY) || "";
      if (accessToken) {
        try {
          const account = await giftAccountCall<AccountListPayload>("list", {}, accessToken);
          if (!active) return;
          const rows = (account.gifts || []).filter(gift => validCode(gift.code));
          setGifts(rows);
          setAccountEmail(account.email);
          setScreen("account");

          // Direct-access emails can still open their specific gift safely.
          if (validCode(requestedCode) && rows.some(gift => gift.code === requestedCode)) {
            const target = rows.find(gift => gift.code === requestedCode)!;
            if (!(target.templateVersion === "premium-v5" && target.experienceSlug === "pareja")) {
              try {
                const opened = await giftAccountCall<AccountOpenPayload>("open", { code: requestedCode }, accessToken);
                if (opened.editorToken) {
                  window.localStorage.setItem(editorAccessKey(requestedCode), opened.editorToken);
                  window.location.replace(publicPath("/editar/" + requestedCode));
                }
              } catch { /* Keep the customer's dashboard accessible if editor access fails. */ }
            }
          }
          return;
        } catch (error) {
          if (!active) return;
          const reason = error instanceof Error ? error.message : "";
          if (reason === "account_unauthorized") {
            window.localStorage.removeItem(ACCOUNT_TOKEN_KEY);
          } else {
            setEmailMessage("No pudimos cargar tu cuenta. Podés volver a intentarlo con un enlace de acceso.");
          }
        }
      }

      const stored = await localSavedGifts();
      if (!active) return;
      setLocalGifts(stored);
      setScreen("login");
    };
    void run();
    return () => { active = false; };
  }, []);

  async function requestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || emailState === "sending") return;
    setEmailState("sending");
    setEmailMessage("");
    try {
      await requestGiftAccountLink(normalizedEmail);
      setEmailState("sent");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      setEmailState("error");
      setEmailMessage(reason === "email_rate_limited"
        ? "Solicitaste varios accesos seguidos. Esperá unos minutos y volvé a intentar."
        : "No pudimos enviar el enlace en este momento. Probá otra vez en unos minutos.");
    }
  }

  async function openGift(gift: GiftRow) {
    if (openingCode) return;
    if (gift.templateVersion === "premium-v5" && gift.experienceSlug === "pareja") {
      window.location.assign(publicPath("/pedido/" + gift.code));
      return;
    }
    setOpeningCode(gift.code);
    setOpeningError("");
    try {
      if (accountEmail) {
        const accessToken = window.localStorage.getItem(ACCOUNT_TOKEN_KEY) || "";
        if (!accessToken) throw new Error("account_unauthorized");
        const opened = await giftAccountCall<AccountOpenPayload>("open", { code: gift.code }, accessToken);
        if (!opened.editorToken) throw new Error("editor_token_missing");
        window.localStorage.setItem(editorAccessKey(gift.code), opened.editorToken);
      } else if (!window.localStorage.getItem(editorAccessKey(gift.code))) {
        throw new Error("studio_unauthorized");
      }
      window.location.assign(publicPath("/editar/" + gift.code));
    } catch {
      setOpeningError("No pudimos abrir el editor. Probá nuevamente o volvé a ingresar con tu correo.");
      setOpeningCode("");
    }
  }

  function signOut() {
    window.localStorage.removeItem(ACCOUNT_TOKEN_KEY);
    // Private editor credentials must not remain visible after closing a session.
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("thi_editor_access:")) window.localStorage.removeItem(key);
    }
    setAccountEmail("");
    setGifts([]);
    setLocalGifts([]);
    setEmail("");
    setEmailState("idle");
    setAccessError(false);
    setOpeningError("");
    setScreen("login");
    window.history.replaceState({}, document.title, publicPath("/mis-regalos"));
  }

  const giftCard = (gift: GiftRow, index: number) => {
    const isAssisted = gift.templateVersion === "premium-v5" && gift.experienceSlug === "pareja";
    const experience = getExperience(gift.experienceSlug);
    const isMama = gift.experienceSlug === "mama";
    const recipient = gift.recipientName && gift.recipientName !== "A definir"
      ? gift.recipientName : "alguien especial";
    const title = isMama ? "Para mamá" : (experience?.title || "Un regalo especial");
    const isPublished = gift.status === "published";
    return (
      <article className="account-collection-card" key={gift.code}>
        <div className="account-collection-visual" aria-hidden="true">
          <div className="account-collection-orbit" />
          <div className="account-collection-envelope">
            <span className="account-collection-seal">♥</span>
          </div>
          <span className="account-collection-number">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="account-collection-body">
          <div className="account-collection-meta">
            <span>REGALO {String(index + 1).padStart(2, "0")}</span>
            <span className="account-collection-status">
              <i />{isPublished ? "Listo para compartir" : isAssisted ? "En preparación" : "Listo para personalizar"}
            </span>
          </div>
          <h3>{title}</h3>
          <p>{isPublished
            ? "Tu experiencia está publicada. Podés verla y compartirla."
            : isAssisted
              ? "Estamos preparando una sorpresa única para " + recipient + "."
              : "Completá los nombres, las fotos, las palabras y los recuerdos que la hacen única."}</p>
          <div className="account-collection-actions">
            <button type="button" onClick={() => void openGift(gift)}
              disabled={Boolean(openingCode)} className="account-collection-primary">
              {openingCode === gift.code ? "Abriendo…" : isAssisted ? "Seguir mi regalo" : isPublished ? "Editar experiencia" : "Personalizar regalo"}
              <span aria-hidden="true">↗</span>
            </button>
            {gift.publishedAt && (
              <Link href={publicPath("/r/" + gift.code)} className="account-collection-secondary">
                Ver regalo
              </Link>
            )}
          </div>
        </div>
      </article>
    );
  };

  if (screen === "loading") {
    return <main className="account-shell account-loading">
      <div className="account-loading-symbol" aria-hidden="true">♥</div>
      <p role="status">Preparando tu espacio privado…</p>
    </main>;
  }

  if (screen === "login") return (
    <main className="account-shell account-login-page">
      <header className="account-topbar">
        <Link href={publicPath("/")} className="studio-brand">TE HICE ESTO</Link>
        <Link href={publicPath("/")}>Volver al inicio <span aria-hidden="true">↗</span></Link>
      </header>
      <section className="account-login-layout" aria-labelledby="login-title">
        <div className="account-login-intro">
          <span className="account-kicker"><i /> TU ESPACIO PERSONAL</span>
          <h1 id="login-title">{recoveryMode ? "Volvé a tus regalos." : "Tus regalos. Tu historia. Tu lugar."}</h1>
          <p>{recoveryMode
            ? "Recuperá el acceso a tu cuenta de manera privada, usando el correo de tu compra."
            : "Cada sorpresa que elegiste merece un lugar propio. Entrá para crear, personalizar y volver a vivir tus regalos."}</p>
          <div className="account-login-promises">
            <span><b aria-hidden="true">✦</b> Tus regalos siempre juntos</span>
            <span><b aria-hidden="true">✦</b> Experiencias privadas</span>
            <span><b aria-hidden="true">✦</b> Listos para personalizar</span>
          </div>
        </div>
        <section className="account-signin-card" aria-label={recoveryMode ? "Recuperar acceso" : "Ingresar a mi cuenta"}>
          <div className="account-signin-mark" aria-hidden="true">♥</div>
          <div className="account-signin-eyebrow">{recoveryMode ? "RECUPERAR MI CUENTA" : "ACCESO PARA CLIENTES"}</div>
          <h2>{recoveryMode ? "Recuperemos tu acceso." : "Bienvenido de nuevo."}</h2>
          <p className="account-signin-description">
            {recoveryMode
              ? "Te mandaremos un nuevo enlace seguro para volver a entrar."
              : "Ingresá con el correo que usaste al comprar. Te enviamos un enlace privado para entrar, sin contraseña."}
          </p>
          {accessError && <p className="account-alert" role="alert">
            El enlace anterior venció o ya se utilizó. Solicitá uno nuevo para ingresar.
          </p>}
          {emailMessage && <p className="account-alert" role="alert">{emailMessage}</p>}
          {emailState === "sent" ? (
            <div className="account-login-sent" role="status">
              <div className="account-login-sent-icon" aria-hidden="true">✉</div>
              <h3>Revisá tu correo.</h3>
              <p>Si hay regalos asociados a <strong>{email.trim().toLowerCase()}</strong>, vas a recibir un enlace privado para entrar a tu cuenta.</p>
              <p className="account-login-sent-hint">Abrí el mensaje de Te Hice Esto y tocá «Entrar a mis regalos».</p>
              <button type="button" onClick={() => {setEmailState("idle");setEmailMessage("");}} className="account-subtle-link">
                Usar otro correo
              </button>
            </div>
          ) : (
            <form className="account-recovery-form account-signin-form" onSubmit={requestAccess}>
              <label htmlFor="account-email"><span>Correo electrónico</span></label>
              <input id="account-email" type="email" autoComplete="email" inputMode="email"
                placeholder="tu@email.com" required value={email}
                onChange={event => setEmail(event.target.value)}
                disabled={emailState === "sending"} />
              <button className="studio-main-button" type="submit" disabled={emailState === "sending"}>
                {emailState === "sending" ? "Enviando acceso…" : recoveryMode ? "Recuperar mi acceso" : "Entrar a mi cuenta"}
                <b aria-hidden="true">→</b>
              </button>
              <small className="account-privacy-note">
                Acceso seguro por email. Solo quien pueda abrir tu correo podrá entrar.
              </small>
            </form>
          )}
          <div className="account-signin-divider" />
          {recoveryMode ? (
            <button type="button" className="account-subtle-link" onClick={() => {setRecoveryMode(false);setEmailState("idle");setEmailMessage("");}}>
              ← Volver al ingreso de clientes
            </button>
          ) : (
            <button type="button" className="account-subtle-link" onClick={() => {setRecoveryMode(true);setEmailState("idle");setEmailMessage("");}}>
              ¿Tenés problemas para entrar? Recuperar acceso
            </button>
          )}
        </section>
      </section>
      {localGifts.length > 0 && (
        <section className="account-device-saved" aria-label="Regalos guardados en este dispositivo">
          <h2>También tenés regalos guardados en este dispositivo</h2>
          <p>Podés continuar editándolos o ingresar con tu cuenta para ver todos tus regalos.</p>
          <div>{localGifts.map(gift => (
            <button key={gift.code} type="button" onClick={() => void openGift(gift)}>
              {getExperience(gift.experienceSlug)?.title || "Tu regalo"} <span aria-hidden="true">→</span>
            </button>
          ))}</div>
        </section>
      )}
      <footer className="account-login-footer">
        Un regalo que no se abre. Se vive. <span>— Te Hice Esto</span>
      </footer>
    </main>
  );

  return (
    <main className="account-shell account-dashboard">
      <header className="account-topbar">
        <Link href={publicPath("/")} className="studio-brand">TE HICE ESTO</Link>
        <div className="account-dashboard-navigation">
          <span className="account-dashboard-email" title={accountEmail}>{accountEmail}</span>
          <button type="button" onClick={signOut} className="account-signout">Cerrar sesión</button>
        </div>
      </header>

      <section className="account-dashboard-hero" aria-labelledby="dashboard-title">
        <span className="account-kicker"><i /> MI CUENTA · ACCESO PRIVADO</span>
        <h1 id="dashboard-title">Tu colección de momentos especiales.</h1>
        <p>Acá están los regalos que elegiste. Cada uno espera tus recuerdos, tus palabras y tu toque personal.</p>
        <div className="account-dashboard-summary">
          <div><strong>{String(gifts.length).padStart(2, "0")}</strong><span>{gifts.length === 1 ? "Regalo en tu cuenta" : "Regalos en tu cuenta"}</span></div>
          <div><strong>{String(gifts.filter(gift => gift.status === "published").length).padStart(2, "0")}</strong><span>Listos para compartir</span></div>
          <Link href={publicPath("/crear")}>Crear otro regalo <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="account-collection" aria-labelledby="collection-title">
        <div className="account-collection-heading">
          <div><span className="account-collection-label">TU ESPACIO</span><h2 id="collection-title">Mis regalos</h2></div>
          <p>{gifts.length ? "Elegí uno y empezá a personalizarlo." : "Todavía no tenés regalos asociados a esta cuenta."}</p>
        </div>
        {openingError && <p className="account-alert" role="alert">{openingError}</p>}
        {gifts.length ? (
          <div className="account-collection-grid">{gifts.map(giftCard)}</div>
        ) : (
          <div className="account-collection-empty">
            <span aria-hidden="true">♡</span>
            <h3>Tu primera historia puede empezar hoy.</h3>
            <p>Cuando elijas un regalo con este correo, lo vas a encontrar acá.</p>
            <Link href={publicPath("/crear")}>Elegir una experiencia →</Link>
          </div>
        )}
      </section>
      <footer className="account-dashboard-footer">
        <span>TE HICE ESTO</span> Los mejores recuerdos merecen quedarse.
      </footer>
    </main>
  );
}
