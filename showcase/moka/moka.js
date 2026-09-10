(() => {
  const app = document.querySelector('#moka-app');
  if (!app) return;

  const prizes = [
    'Upgrade de café',
    'Medialuna gratis',
    '10% en tu próxima visita',
    'Café gratis',
    'Premio especial Moka',
  ];

  let selectedPrize = null;
  let spinning = false;

  const coffeeIcon = `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M14 25h31v14c0 9-7 15-15.5 15S14 48 14 39V25Z"/>
      <path d="M45 29h4.5a8 8 0 0 1 0 16H44"/>
      <path d="M22 10c0 4 4 4 4 8M34 8c0 4 4 4 4 8"/>
      <path d="M11 55h39"/>
    </svg>`;

  const whatsappIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4A8 8 0 1 1 20 11.5Z"/>
      <path d="M9 8.5c.5 2 2 3.7 4.2 4.8l1.3-1.1 2 .7"/>
    </svg>`;

  function shell(content) {
    app.innerHTML = `
      <main class="moka-page">
        <section class="phone" aria-live="polite">
          <header class="brand">
            <span class="brand-mark"><span>M</span></span>
            <span class="brand-copy"><strong>Moka</strong><small>Café de especialidad</small></span>
            <span class="brand-line"></span>
          </header>
          ${content}
          <footer class="powered"><span>Experiencia creada con</span><b>Viralio</b></footer>
        </section>
      </main>`;
  }

  function renderLanding() {
    selectedPrize = null;
    spinning = false;
    shell(`
      <div class="stage landing-stage">
        <div class="gift-object" aria-label="Regalo Moka">
          <span class="gift-orbit one"></span>
          <span class="gift-orbit two"></span>
          <span class="gift-core">${coffeeIcon}</span>
          <span class="gift-tag">UN REGALO · MOKA</span>
        </div>
        <div class="stage-copy">
          <p class="kicker">Moka tiene algo para vos</p>
          <h1>Tenemos un regalo especial para vos.</h1>
          <p class="lead">Una pequeña sorpresa para hacer todavía mejor tu próxima pausa en Moka.</p>
        </div>
        <button class="primary" id="open-gift">Abrir mi regalo <span>→</span></button>
        <p class="micro">Sin registrarte. Sin descargar ninguna app.</p>
      </div>`);

    document.querySelector('#open-gift')?.addEventListener('click', renderShare);
  }

  function renderShare() {
    shell(`
      <div class="stage share-stage">
        <div class="share-gift" aria-hidden="true">
          <div class="share-gift-top"><span>MOKA</span><span>PARA COMPARTIR</span></div>
          <div class="share-seal"><span>M</span></div>
          <div class="share-gift-bottom">Hay un regalo esperando por vos.<br>Descubrilo en Moka.</div>
        </div>
        <div class="stage-copy">
          <p class="kicker">Compartí el regalo</p>
          <h1>Antes de descubrir el tuyo, regalale uno a alguien.</h1>
          <p class="lead">Compartilo por WhatsApp. La otra persona también recibe su propio regalo y el tuyo sigue siendo sólo tuyo.</p>
        </div>
        <div class="share-explain">
          <span class="share-explain-icon">✦</span>
          <span><strong>Un regalo genera otro regalo</strong><small>Tu contacto entra con su propio pase. Nunca recibe tu premio.</small></span>
        </div>
        <button class="primary whatsapp" id="share-whatsapp">${whatsappIcon}<span>Compartir por WhatsApp</span></button>
        <p class="good-news">Las buenas noticias también se comparten.</p>
      </div>`);

    document.querySelector('#share-whatsapp')?.addEventListener('click', shareAndUnlock);
  }

  function shareAndUnlock() {
    const button = document.querySelector('#share-whatsapp');
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span><span>Preparando tu regalo…</span>';
    }

    const cleanUrl = window.location.href.split('?')[0].split('#')[0];
    const message = `Moka me dejó un regalo sorpresa ☕🎁\nHay otro esperando por vos. Descubrilo acá: ${cleanUrl}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');

    window.setTimeout(renderWheel, 650);
  }

  function wheelMarkup() {
    const labels = prizes.map((prize, index) => {
      const angle = index * 72 + 36;
      return `<span class="wheel-label" style="--a:${angle}deg"><b>${prize}</b></span>`;
    }).join('');

    return `
      <div class="wheel-wrap">
        <span class="pointer" aria-hidden="true"></span>
        <div class="wheel">
          ${labels}
          <span class="wheel-center"><span>M</span><small>MOKA</small></span>
        </div>
      </div>`;
  }

  function renderWheel() {
    shell(`
      <div class="stage wheel-stage">
        <div class="stage-copy">
          <p class="kicker">✓ Regalo desbloqueado</p>
          <h1>Ahora sí. Que gire.</h1>
          <p class="lead">Tu premio te espera para una próxima visita a Moka.</p>
        </div>
        ${wheelMarkup()}
        <button class="primary" id="spin-wheel">Girar la ruleta <span>→</span></button>
        <p class="micro">9 vueltas · un solo premio · sólo para vos</p>
      </div>`);

    document.querySelector('#spin-wheel')?.addEventListener('click', spinWheel);
  }

  function spinWheel() {
    if (spinning) return;
    spinning = true;

    const button = document.querySelector('#spin-wheel');
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span><span>Descubriendo…</span>';
    }

    const index = Math.floor(Math.random() * prizes.length);
    selectedPrize = {
      name: prizes[index],
      index,
      code: `MOKA-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    };

    const wheel = document.querySelector('.wheel');
    const rotation = 9 * 360 - (index * 72 + 36);
    requestAnimationFrame(() => {
      wheel?.style.setProperty('--landing', `${rotation}deg`);
      wheel?.classList.add('spinning');
    });

    window.setTimeout(renderReward, 4700);
  }

  function expirationDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  function renderReward() {
    spinning = false;
    const prize = selectedPrize || {
      name: prizes[0],
      code: `MOKA-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    };

    shell(`
      <div class="stage reward-stage">
        <div class="reward-burst" aria-hidden="true">
          <div class="reward-medal"><span>M</span></div>
        </div>
        <div class="stage-copy">
          <p class="kicker">Este regalo es tuyo</p>
          <h1>${prize.name}</h1>
          <p class="lead">Guardá este voucher y presentalo en Moka antes de la fecha de vencimiento.</p>
        </div>
        <article class="voucher" aria-label="Voucher de premio Moka">
          <div class="voucher-top"><span class="voucher-brand">MOKA</span><span>REGALO VIRALIO</span></div>
          <div class="voucher-main">
            <div class="voucher-prize"><small>Tu premio</small><strong>${prize.name}</strong></div>
            <div class="voucher-code"><small>Código</small><strong>${prize.code}</strong></div>
          </div>
          <div class="voucher-expiration"><small>FECHA DE VENCIMIENTO</small><strong>${expirationDate()}</strong></div>
          <div class="voucher-note">Válido por 7 días · Un uso · Presentá este voucher al momento de canjear.</div>
        </article>
        <button class="restart" id="restart-demo">Volver a empezar</button>
      </div>`);

    document.querySelector('#restart-demo')?.addEventListener('click', renderLanding);
  }

  renderLanding();
})();
