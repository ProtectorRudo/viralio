"use client";

import { useState } from "react";

interface PilotReadiness {
  repository: "json" | "memory" | "postgres";
  database: boolean;
  auth: boolean;
  onboarding: boolean;
  brandAi: boolean;
  brandModel: string;
  pilotReady: boolean;
}

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid rgba(127,127,127,.16)" }}>
      <span>{children}</span>
      <strong aria-label={ok ? "listo" : "pendiente"}>{ok ? "✓ Listo" : "○ Pendiente"}</strong>
    </div>
  );
}

export function PilotReadinessPanel() {
  const [onboardingKey, setOnboardingKey] = useState("");
  const [readiness, setReadiness] = useState<PilotReadiness>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkReadiness() {
    setBusy(true);
    setError("");
    setReadiness(undefined);
    try {
      const response = await fetch("/api/onboarding/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingKey }),
      });
      const payload = await response.json() as PilotReadiness & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "No se pudo verificar el entorno");
        return;
      }
      setReadiness(payload);
    } catch {
      setError("No se pudo conectar con Viralio");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside data-testid="pilot-readiness" style={{ maxWidth: 880, margin: "24px auto 0", padding: "0 20px", position: "relative", zIndex: 2 }}>
      <div style={{ padding: 18, borderRadius: 20, border: "1px solid rgba(127,127,127,.2)", background: "rgba(255,255,255,.74)", backdropFilter: "blur(18px)", boxShadow: "0 18px 60px rgba(0,0,0,.08)" }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Pilot readiness</p>
        <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>¿Viralio está listo para un comercio real?</h2>
        <p className="field-hint" style={{ marginTop: 0 }}>Usá la misma clave privada de alta. El diagnóstico no muestra ni transmite secretos al navegador.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ flex: "1 1 260px" }}>
            Clave privada de alta
            <input data-testid="readiness-key" type="password" autoComplete="off" value={onboardingKey} onChange={(event) => setOnboardingKey(event.target.value)} />
          </label>
          <button className="onboarding-secondary" data-testid="check-readiness" type="button" disabled={busy || !onboardingKey} onClick={() => void checkReadiness()}>
            {busy ? "Verificando…" : "Verificar entorno"}
          </button>
        </div>

        {error && <p className="onboarding-error" role="alert">{error}</p>}
        {readiness && (
          <div data-testid="readiness-result" style={{ marginTop: 14 }}>
            <Status ok={readiness.database}>PostgreSQL ({readiness.repository})</Status>
            <Status ok={readiness.auth}>Autenticación y canje seguro</Status>
            <Status ok={readiness.onboarding}>Alta privada de comercios</Status>
            <Status ok={readiness.brandAi}>Brand Engine · {readiness.brandModel}</Status>
            <p style={{ margin: "14px 0 0", fontWeight: 700 }}>
              {readiness.pilotReady
                ? "✓ Entorno listo para ejecutar el smoke de primer piloto."
                : readiness.brandAi
                  ? "Hay infraestructura pendiente antes del piloto."
                  : "La experiencia puede usar fallback Viralio, pero falta activar ChatGPT para el piloto con identidad automática."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
