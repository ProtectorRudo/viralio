"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./maurilio-fallback.module.css";

type Mode = "login" | "register";
type Role = "user" | "tipster";

export default function AuthView() {
  const search = useSearchParams();
  const initialRole: Role =
    search.get("tipo") === "tipster" ? "tipster" : "user";

  const [mode, setMode] = useState<Mode>("register");
  const [role, setRole] = useState<Role>(initialRole);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const title = useMemo(() => {
    if (mode === "login") return "Ingresá a Maurilio.";
    return role === "tipster"
      ? "Creá tu perfil de tipster."
      : "Creá tu cuenta.";
  }, [mode, role]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);

    try {
      const endpoint =
        mode === "login"
          ? "/maurilio/api/auth/login"
          : "/maurilio/api/auth/register";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : { email, password, displayName, role },
        ),
      });

      const body = (await response.json()) as {
        ok?: boolean;
        needsConfirmation?: boolean;
        error?: string;
      };

      if (!response.ok) {
        if (body.error === "invalid_credentials") {
          setMessage("Email o contraseña incorrectos.");
        } else if (body.error === "invalid_password") {
          setMessage("Usá una contraseña de al menos 8 caracteres.");
        } else {
          setMessage("No pudimos completar el acceso.");
        }
        return;
      }

      if (body.needsConfirmation) {
        setMessage("Revisá tu email para confirmar la cuenta.");
        return;
      }

      window.location.assign(
        role === "tipster" && mode === "register"
          ? "/maurilio/para-tipsters"
          : "/maurilio",
      );
    } catch {
      setMessage("No pudimos conectar con el sistema de cuentas.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.authView}>
      <div className={styles.authIntro}>
        <span>CUENTA MAURILIO</span>
        <h1>{title}</h1>
        <p>
          Una sola cuenta. Podés seguir tipsters o publicar tus propios tips si
          te registrás como tipster.
        </p>
      </div>

      <div className={styles.authCard}>
        <div className={styles.authMode}>
          <button
            type="button"
            className={mode === "register" ? styles.authModeActive : undefined}
            onClick={() => setMode("register")}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            className={mode === "login" ? styles.authModeActive : undefined}
            onClick={() => setMode("login")}
          >
            Ingresar
          </button>
        </div>

        {mode === "register" ? (
          <div className={styles.authRoles}>
            <button
              type="button"
              className={role === "user" ? styles.authRoleActive : undefined}
              onClick={() => setRole("user")}
            >
              <b>Quiero seguir tipsters</b>
              <span>Ver perfiles, historial y suscribirme.</span>
            </button>
            <button
              type="button"
              className={role === "tipster" ? styles.authRoleActive : undefined}
              onClick={() => setRole("tipster")}
            >
              <b>Soy tipster</b>
              <span>Publicar tips y construir historial verificable.</span>
            </button>
          </div>
        ) : null}

        <form className={styles.authForm} onSubmit={submit}>
          {mode === "register" ? (
            <label>
              <span>Nombre público</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={2}
                maxLength={60}
                required
                placeholder="Ej. Fútbol Con Valor"
                autoComplete="name"
              />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              placeholder="vos@email.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Contraseña</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={8}
              required
              placeholder="8 caracteres o más"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>

          <button type="submit" disabled={busy}>
            {busy
              ? "Procesando…"
              : mode === "login"
                ? "Ingresar"
                : role === "tipster"
                  ? "Crear cuenta de tipster"
                  : "Crear cuenta"}
          </button>
        </form>

        {message ? <p className={styles.authMessage}>{message}</p> : null}
      </div>
    </section>
  );
}
