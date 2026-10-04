"use client";

export default function PrivateGiftError({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <main className="private-gift-error">
    <span>TE HICE ESTO</span>
    <h1>No pudimos abrir este regalo.</h1>
    <p>Puede ser una interrupción momentánea. El contenido privado no fue expuesto ni modificado.</p>
    <button type="button" onClick={reset}>Intentar otra vez</button>
  </main>;
}