(() => {
  "use strict";

  const OWNER_WHATSAPP = "5492236818230";
  const STORAGE_KEY = "viralio:el-gordo-leo:pilot:v1";
  const VALIDITY_DAYS = 7;
  const SPIN_MS = 3600;
  const prizes = [
    { id: "discount_5", label: "5% de descuento", wheel: "5%", probability: 35, midpoint: 63 },
    { id: "discount_10", label: "10% de descuento", wheel: "10%", probability: 25, midpoint: 171 },
    { id: "discount_15", label: "15% de descuento", wheel: "15%", probability: 10, midpoint: 234 },
    { id: "cassata", label: "Helado cassata de regalo", wheel: "CASSATA", probability: 15, midpoint: 279 },
    { id: "bombon", label: "Bombón escocés de regalo", wheel: "BOMBÓN", probability: 15, midpoint: 333 },
  ];

  const query = new URLSearchParams(window.location.search);
  if (query.get("reset") === "1") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Si el navegador bloquea localStorage, igual continuamos desde landing.
    }
    query.delete("reset");
    const nextQuery = query.toString();
    const cleanUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", cleanUrl);
  }

  const app = document.getElementById("app");
  let state = loadState() || { stage: "landing" };
  let spinTarget = null;

  function loadState() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!value) return null;
      if (value.expiresAt && new Date(value.expiresAt).getTime() < Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function couponCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint32Array(6);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 0xffffffff);
    return `LEO-${Array.from(bytes, n => alphabet[n % alphabet.length]).join("")}`;
  }

  function expiryDate() {
    const date = new Date();
    date.setDate(date.getDate() + VALIDITY_DAYS);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
  }

  function pickPrize() {
    const total = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    let draw = Math.random() * total;
    for (const prize of prizes) {
      draw -= prize.probability;
      if (draw < 0) return prize;
    }
    return prizes[0];
  }

  function brand() {
    return `
      <header class="brandbar">
        <span class="mark" aria-hidden="true">GL</span>
        <span><strong>Mini Mercado El Gordo Leo</strong><small>Premios para volver</small></span>
        <span class="viralio-chip">VIRALIO</span>
      </header>`;
  }

  function steps(active) {
    return `<div class="steps" aria-hidden="true">
      <span class="step ${active > 1 ? "done" : active === 1 ? "on" : ""}"></span>
      <span class="step ${active > 2 ? "done" : active === 2 ? "on" : ""}"></span>
      <span class="step ${active > 3 ? "done" : active === 3 ? "on" : ""}"></span>
    </div>`;
  }

  function footer() {
    return `<footer class="footer"><span>Experiencia creada con</span><b>Viralio</b></footer>`;
  }

  function shell(content) {
    app.innerHTML = `<article class="experience fade">${brand()}${content}${footer()}</article>`;
  }

  function renderLanding() {
    shell(`
      <section class="stage">
        <p class="kicker">Hay algo para vos</p>
        <h1>Tenemos un regalo para vos.</h1>
        <p class="lead">El Gordo Leo preparó beneficios para clientes. Abrí tu pase, compartilo y descubrí qué te toca.</p>
        <div class="hero-card" aria-hidden="true">
          <span class="tiny">PASE · EL GORDO LEO</span>
          <span class="gift">GL</span>
          <strong>Siempre ganás algo.</strong>
        </div>
        <button class="primary" id="start">Descubrir mi premio <span aria-hidden="true">→</span></button>
        <p class="trust">El premio se usa en tu próxima compra y queda guardado en este dispositivo.</p>
      </section>`);
    document.getElementById("start").addEventListener("click", () => {
      state.stage = "share";
      saveState();
      render();
    });
  }

  function referralText() {
    return `El Gordo Leo está regalando premios para la próxima compra 🎁\nProbá tu pase acá:\n${window.location.href.split("?")[0]}`;
  }

  function unlockWheel() {
    state.stage = "wheel";
    state.sharedAt = new Date().toISOString();
    saveState();
    window.setTimeout(render, 120);
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(referralText())}`, "_blank", "noopener,noreferrer");
    unlockWheel();
  }

  function renderShare() {
    shell(`
      <section class="stage">
        ${steps(1)}
        <p class="kicker">Paso 1 de 3</p>
        <h1>Antes de descubrir el tuyo, regalale uno a alguien.</h1>
        <p class="lead">Compartilo por WhatsApp. La otra persona también recibe su propio regalo y el tuyo sigue siendo solo tuyo.</p>
        <div class="share-poster">
          <small>MINI MERCADO · EL GORDO LEO</small>
          <b>Hay un premio esperando.</b>
          <span>5%, 10%, 15% o regalos para la próxima compra.</span>
        </div>
        <button class="whatsapp" id="share-wa">Compartir por WhatsApp <span aria-hidden="true">↗</span></button>
        <p class="trust">La ruleta se habilita cuando compartís el pase por WhatsApp.</p>
      </section>`);
    document.getElementById("share-wa").addEventListener("click", shareWhatsApp);
  }

  function wheelMarkup() {
    return `<div class="wheel-shell">
      <span class="pointer" aria-hidden="true"></span>
      <div class="wheel" id="wheel" aria-label="Ruleta de premios">
        <span class="wheel-label l1">5%</span>
        <span class="wheel-label l2">10%</span>
        <span class="wheel-label l3">15%</span>
        <span class="wheel-label l4">CASSATA</span>
        <span class="wheel-label l5">BOMBÓN</span>
      </div>
    </div>`;
  }

  function spin() {
    if (spinTarget) return;
    spinTarget = pickPrize();
    const wheel = document.getElementById("wheel");
    const stage = document.querySelector(".stage");
    stage.classList.add("spinning");
    const jitter = (Math.random() * 10) - 5;
    const rotation = (6 * 360) + (360 - spinTarget.midpoint) + jitter;
    requestAnimationFrame(() => { wheel.style.transform = `rotate(${rotation}deg)`; });
    window.setTimeout(() => {
      state = {
        stage: "reward",
        prizeId: spinTarget.id,
        prizeLabel: spinTarget.label,
        code: couponCode(),
        issuedAt: new Date().toISOString(),
        expiresAt: expiryDate(),
      };
      saveState();
      spinTarget = null;
      render();
    }, SPIN_MS + 180);
  }

  function renderWheel() {
    shell(`
      <section class="stage">
        ${steps(2)}
        <p class="kicker">Paso 2 de 3</p>
        <h1>Ahora sí. Que gire.</h1>
        <p class="lead">Todos los espacios tienen premio. El resultado queda guardado y no cambia al recargar.</p>
        ${wheelMarkup()}
        <p class="spin-note">Un solo giro por pase · premio válido por ${VALIDITY_DAYS} días</p>
        <button class="primary" id="spin">Girar la ruleta <span aria-hidden="true">→</span></button>
      </section>`);
    document.getElementById("spin").addEventListener("click", spin);
  }

  function couponMessage(marketingOptIn) {
    const consent = marketingOptIn ? "\n\n✅ También quiero recibir ofertas y beneficios de El Gordo Leo por WhatsApp." : "";
    return `Hola Mini Mercado El Gordo Leo 👋\nParticipé en Viralio y gané: ${state.prizeLabel}.\nCupón: ${state.code}\nVálido hasta: ${formatDate(state.expiresAt)}.\nLo voy a usar en mi próxima compra.${consent}`;
  }

  function sendCoupon() {
    const optIn = document.getElementById("offers-optin").checked;
    state.marketingOptIn = optIn;
    state.sentAt = new Date().toISOString();
    saveState();
    const target = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(couponMessage(optIn))}`;
    window.open(target, "_blank", "noopener,noreferrer");
    const saved = document.getElementById("saved-note");
    saved.hidden = false;
    saved.textContent = optIn
      ? "Listo: el mensaje incluye tu cupón y tu autorización para recibir ofertas."
      : "Listo: tu cupón está preparado para enviárselo al comercio.";
  }

  function renderReward() {
    shell(`
      <section class="stage">
        ${steps(3)}
        <div class="confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <p class="kicker">¡Ganaste!</p>
        <h1 class="prize-title">${state.prizeLabel}</h1>
        <p class="lead">Es para usar en tu próxima compra en Mini Mercado El Gordo Leo.</p>
        <div class="coupon">
          <small>CUPÓN VIRALIO · EL GORDO LEO</small>
          <div class="coupon-code">${state.code}</div>
          <div class="coupon-row"><span>Vence <b>${formatDate(state.expiresAt)}</b></span><span>Estado <b>Disponible</b></span></div>
        </div>
        <p class="rules"><b>Condiciones:</b> válido para la próxima compra, un premio por persona y no acumulable con otros premios o promociones.</p>
        <label class="optin"><input type="checkbox" id="offers-optin" ${state.marketingOptIn ? "checked" : ""}><span><b>Quiero recibir ofertas y beneficios por WhatsApp.</b><br>Es opcional. Podés enviar el cupón aunque no lo marques.</span></label>
        <div class="saved" id="saved-note" ${state.sentAt ? "" : "hidden"}>Tu cupón ya fue preparado para WhatsApp.</div>
        <button class="whatsapp" id="send-coupon">Enviar mi cupón al negocio <span aria-hidden="true">↗</span></button>
        <p class="trust">Al tocar el botón se abre WhatsApp con el mensaje listo. Vos decidís si lo enviás.</p>
      </section>`);
    document.getElementById("send-coupon").addEventListener("click", sendCoupon);
  }

  function render() {
    if (state.stage === "reward" && state.expiresAt && new Date(state.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      state = { stage: "landing" };
    }
    if (state.stage === "share") return renderShare();
    if (state.stage === "wheel") return renderWheel();
    if (state.stage === "reward") return renderReward();
    return renderLanding();
  }

  render();
})();
