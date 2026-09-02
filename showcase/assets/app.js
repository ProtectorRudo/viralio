(() => {
  const configs = {
    moka: {
      slug: "moka",
      name: "Moka",
      monogram: "M",
      category: "Café de especialidad",
      eyebrow: "Un ritual hecho para vos",
      title: "Hay algo especial esperando",
      copy: "Moka preparó un detalle para convertir tu próxima pausa en algo un poco más especial.",
      shareTitle: "Compartí el pase. Abrí la sorpresa.",
      shareCopy: "Elegí dónde compartir tu pase. En la experiencia real, tu invitado recibe su propia oportunidad.",
      socialCopy: "Moka me dejó un pase sorpresa. Hay otro esperando por vos.",
      accentLabel: "PASE · MOKA",
      palette: ["#9f4828", "#6d8169", "#d29a62", "#5b392d", "#e2c49b"],
      prizes: ["Upgrade de café", "Medialuna gratis", "10% próxima visita", "Café gratis", "Premio especial Moka"],
    },
    "atlas-barber": {
      slug: "atlas-barber",
      name: "Atlas Barber",
      monogram: "A",
      category: "Barbería contemporánea",
      eyebrow: "Tu próximo corte empieza acá",
      title: "Tu estilo tiene una sorpresa",
      copy: "Abrí tu pase privado y descubrí un beneficio pensado para tu próxima visita a Atlas.",
      shareTitle: "Pasá el código. Abrí tu beneficio.",
      shareCopy: "Compartí el pase con alguien de tu círculo. Cada persona descubre su propio beneficio.",
      socialCopy: "Atlas me dio un pase privado. Hay otro esperando por vos.",
      accentLabel: "PRIVATE · ATLAS",
      palette: ["#c79a43", "#334b5f", "#a7624a", "#6d8798", "#7c673b"],
      prizes: ["Perfilado de barba", "15% próximo corte", "Tratamiento premium", "Producto de styling", "Ritual Atlas"],
    },
  };

  const merchant = document.body.dataset.merchant;
  const config = configs[merchant];
  const app = document.querySelector("#app");
  if (!config || !app) return;

  let selectedPrize = null;
  let spinning = false;
  const demoCode = () => Math.random().toString(16).slice(2, 10).toUpperCase();

  const icon = (type) => {
    const paths = {
      status: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M16 3h5v5"/><path d="M21 3l-6 6"/>',
      instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
      whatsapp: '<path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c.5 2 2 3.7 4.2 4.8l1.3-1.1 2 .7"/>',
      share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>',
      coffee: '<path d="M6 9h10v5a5 5 0 0 1-10 0V9Z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 5c0 1 1 1 1 2M12 4c0 1 1 1 1 2"/>',
      barber: '<path d="M7 4h10v16H7z"/><path d="m8 7 8 4-8 4 8 4"/>',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[type] || paths.share}</svg>`;
  };

  function shell(content) {
    app.innerHTML = `
      <main class="demo-experience theme-${config.slug}">
        <div class="demo-aurora aurora-a" aria-hidden="true"></div>
        <div class="demo-aurora aurora-b" aria-hidden="true"></div>
        <a class="back-showroom" href="../">← Showroom</a>
        <section class="demo-phone" aria-live="polite">
          <header class="demo-brand">
            <span class="demo-brandmark"><b>${config.monogram}</b></span>
            <span class="demo-brandcopy"><strong>${config.name}</strong><small>${config.category}</small></span>
            <span class="demo-brandline"></span>
          </header>
          ${content}
          <footer class="demo-signature"><span>Demo visual</span><i></i><span>Powered by</span><strong><b>V</b> Viralio</strong></footer>
        </section>
      </main>`;
  }

  function renderLanding() {
    shell(`
      <div class="demo-stage landing-stage">
        <div class="mystery-premium" aria-label="Premio oculto">
          <span class="mystery-orbit orbit-one"></span>
          <span class="mystery-orbit orbit-two"></span>
          <span class="mystery-core">${icon(config.slug === "moka" ? "coffee" : "barber")}</span>
          <span class="mystery-label">${config.accentLabel}</span>
        </div>
        <div class="stage-copy">
          <p class="demo-eyebrow">${config.eyebrow}</p>
          <h1>${config.title}</h1>
          <p class="demo-lead">${config.copy}</p>
        </div>
        <button class="demo-button primary" id="discover">Descubrir mi premio <span>→</span></button>
        <p class="micro-trust"><b>✦</b> Sin registro. Sin instalar una app.</p>
      </div>`);
    document.querySelector("#discover")?.addEventListener("click", renderShare);
  }

  function renderShare() {
    shell(`
      <div class="demo-stage share-stage">
        <div class="share-card-preview" aria-hidden="true">
          <div class="share-card-inner"><small>${config.name}</small><b>Hay una sorpresa<br>esperando por vos.</b><span>Descubrila con Viralio</span></div>
          <i></i><i></i>
        </div>
        <div class="stage-copy share-heading">
          <p class="demo-eyebrow">El momento viral</p>
          <h1>${config.shareTitle}</h1>
          <p class="demo-lead">${config.shareCopy}</p>
        </div>
        <div class="share-grid" aria-label="Opciones para compartir">
          <button class="share-choice" data-channel="Estado de WhatsApp"><span class="share-icon whatsapp-status">${icon("status")}</span><span><strong>Estado de WhatsApp</strong><small>Pase vertical 9:16</small></span><b>↗</b></button>
          <button class="share-choice" data-channel="Instagram Stories"><span class="share-icon instagram">${icon("instagram")}</span><span><strong>Instagram Stories</strong><small>Diseñado para historias</small></span><b>↗</b></button>
          <button class="share-choice" data-channel="WhatsApp"><span class="share-icon whatsapp">${icon("whatsapp")}</span><span><strong>Enviar por WhatsApp</strong><small>A una persona o grupo</small></span><b>↗</b></button>
          <button class="share-choice" data-channel="Otras apps"><span class="share-icon other">${icon("share")}</span><span><strong>Compartir por otras apps</strong><small>Menú nativo del teléfono</small></span><b>↗</b></button>
        </div>
        <p class="demo-note">Demo visual: acá no se publica nada realmente.</p>
      </div>`);

    document.querySelectorAll(".share-choice").forEach((button) => {
      button.addEventListener("click", () => prepareShare(button));
    });
  }

  function prepareShare(button) {
    if (button.disabled) return;
    document.querySelectorAll(".share-choice").forEach((item) => { item.disabled = true; });
    const label = button.dataset.channel || "Compartir";
    button.classList.add("preparing");
    const copy = button.querySelector("strong");
    if (copy) copy.textContent = `Preparando ${label}…`;
    window.setTimeout(renderWheel, 720);
  }

  function wheelMarkup() {
    const count = config.prizes.length;
    const labels = config.prizes.map((prize, index) => {
      const angle = index * (360 / count) + 360 / count / 2;
      return `<span class="wheel-word" style="--label-angle:${angle}deg"><b>${prize}</b></span>`;
    }).join("");
    const gradient = config.palette.map((color, index) => {
      const start = index * (360 / count);
      const end = (index + 1) * (360 / count);
      return `${color} ${start}deg ${end}deg`;
    }).join(",");
    return `
      <div class="demo-wheel-wrap">
        <div class="wheel-pointer-premium"><span></span></div>
        <div class="demo-wheel" style="--wheel-gradient:conic-gradient(from -90deg,${gradient})">
          ${labels}
          <span class="wheel-center"><b>${config.monogram}</b><small>VIRALIO</small></span>
        </div>
      </div>`;
  }

  function renderWheel() {
    shell(`
      <div class="demo-stage wheel-stage-static">
        <div class="stage-copy wheel-copy">
          <p class="demo-eyebrow success">✓ Pase desbloqueado</p>
          <h1>Ahora sí.<br>Que gire.</h1>
          <p class="demo-lead">El resultado aparece después del giro. En Viralio real, el premio lo decide el servidor.</p>
        </div>
        ${wheelMarkup()}
        <button class="demo-button primary" id="spin">Girar la ruleta <span>→</span></button>
        <p class="micro-trust"><b>◇</b> 9 vueltas · desaceleración suave</p>
      </div>`);
    document.querySelector("#spin")?.addEventListener("click", spinWheel);
  }

  function spinWheel() {
    if (spinning) return;
    spinning = true;
    const button = document.querySelector("#spin");
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="mini-spinner"></span> Revelando…';
    }
    const wheel = document.querySelector(".demo-wheel");
    const index = Math.floor(Math.random() * config.prizes.length);
    selectedPrize = { name: config.prizes[index], index, code: demoCode() };
    const segment = 360 / config.prizes.length;
    const rotation = 9 * 360 - (index * segment + segment / 2);
    requestAnimationFrame(() => {
      wheel?.style.setProperty("--landing-angle", `${rotation}deg`);
      wheel?.classList.add("spinning");
    });
    window.setTimeout(renderReward, 4200);
  }

  function renderReward() {
    spinning = false;
    const prize = selectedPrize || { name: config.prizes[0], code: demoCode() };
    shell(`
      <div class="demo-stage reward-stage-static">
        <div class="reward-rays" aria-hidden="true"><i></i><i></i><i></i><i></i><b>✦</b></div>
        <div class="reward-medal"><span>${config.monogram}</span><small>PREMIO<br>REVELADO</small></div>
        <div class="stage-copy reward-copy">
          <p class="demo-eyebrow success">Es tuyo</p>
          <h1>${prize.name}</h1>
          <p class="demo-lead">Así se ve el momento de recompensa. En el producto real queda una tarjeta única y canjeable.</p>
        </div>
        <div class="reward-demo-ticket">
          <span><small>Código demo</small><strong>${prize.code}</strong></span>
          <i></i>
          <span><small>Estado</small><strong>Disponible</strong></span>
          <b>DEMO</b>
        </div>
        <button class="demo-button whatsapp-demo" id="save-demo">Guardar premio en WhatsApp</button>
        <button class="demo-button ghost" id="restart">Volver a empezar</button>
        <p class="demo-note">Esta recompensa es ficticia y sólo forma parte del showroom.</p>
      </div>`);
    document.querySelector("#restart")?.addEventListener("click", renderLanding);
    document.querySelector("#save-demo")?.addEventListener("click", (event) => {
      const target = event.currentTarget;
      target.textContent = "✓ Premio demo preparado";
      target.disabled = true;
    });
  }

  renderLanding();
})();
