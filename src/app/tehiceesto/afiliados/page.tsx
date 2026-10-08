"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AFFILIATE_SESSION_KEY,affiliatePublicCall } from "../affiliateApi";

export default function AffiliateLoginPortal(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function onLogin(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const identifier=String(form.get("identifier")||"").trim().toLowerCase();
    const password=String(form.get("password")||"");
    setBusy(true);
    setError("");
    try{
      const result=await affiliatePublicCall<{token:string;affiliate:{slug:string}}>("login",{identifier,password});
      if(!/^[a-z0-9][a-z0-9-]{2,49}$/.test(result.affiliate?.slug||""))throw new Error("invalid_affiliate");
      window.sessionStorage.setItem(AFFILIATE_SESSION_KEY,result.token);
      router.replace("/afiliados/"+result.affiliate.slug);
    }catch{
      setError("Revisá el usuario y la contraseña. Si continúa el problema, contactanos.");
    }finally{
      setBusy(false);
    }
  }

  return (
    <main className="thi-aff-public-shell thi-aff-login-shell">
      <section className="thi-aff-login-card">
        <span className="thi-aff-brand">TE HICE ESTO</span>
        <span className="thi-aff-login-mark" aria-hidden="true">↗</span>
        <p className="thi-kicker">ACCESO PARA INFLUENCERS</p>
        <h1>Tu recomendación.<br/><em>Tus números.</em></h1>
        <p>Un espacio para seguir tus visitas, ventas y comisiones, con toda la información en un solo lugar.</p>
        <form onSubmit={onLogin}>
          <label>
            <span>Usuario o correo</span>
            <input name="identifier" autoComplete="username" placeholder="Tu usuario" required spellCheck={false} style={{color:"#30272b",WebkitTextFillColor:"#30272b",background:"#fffdf9",fontSize:16}}/>
          </label>
          <label>
            <span>Contraseña</span>
            <input name="password" type="password" autoComplete="current-password" placeholder="Tu contraseña" minLength={8} required style={{color:"#30272b",WebkitTextFillColor:"#30272b",background:"#fffdf9",fontSize:16}}/>
          </label>
          {error&&<small className="thi-aff-login-error" role="alert">{error}</small>}
          <button type="submit" className="thi-primary" disabled={busy}>{busy?"Ingresando…":"Entrar a mi panel →"}</button>
        </form>
        <small>Tu información y tus comisiones permanecen privadas.</small>
      </section>
    </main>
  );
}
