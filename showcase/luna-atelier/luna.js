(() => {
  const app = document.querySelector('#luna-app');
  if (!app) return;

  const prizes = [
    { name: '10% de descuento', wheelLabel: '10% OFF' },
    { name: '15% de descuento', wheelLabel: '15% OFF' },
    { name: 'Accesorio de regalo', wheelLabel: 'Accesorio' },
    { name: 'Envío gratis', wheelLabel: 'Envío gratis' },
    { name: '$5.000 de descuento', wheelLabel: '$5.000 OFF', darkLabel: true },
  ];

  let selectedPrize = null;
  let spinning = false;

  const hangerIcon = `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M33 14c0-3-2-5-5-5s-5 2-5 5c0 2 1 4 3 5l2 1" />
      <path d="M30 20l21 16c2 1 1 4-1 4H14c-2 0-3-3-1-4l17-12" />
      <path d="M12 40l6 8h28l6-8" />
    </svg>`;

  const whatsappIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4A8 8 0 1 1 20 11.5Z"/>
      <path d="M9 8.5c.5 2 2 3.7 4.2 4.8l1.3-1.1 2 .7"/>
    </svg>`;

  function shell(content) {
    app.innerHTML = `
      <main class="luna-page">
        <section class="phone" aria-live="polite">
          <header class="brand">
            <span class="brand-mark"><span>L</span></span>
            <span class="brand-copy"><strong>LUNA Atelier</strong><small>Moda con identidad</small></span>
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
        <div class="gift-object" aria-label="Regalo LUNA Atelier">
          <span class="gift-orbit one"></span>
          <span class="gift-orbit two"></span>
          <span class="gift-core">${hangerIcon}</span>
          <span class="gift-tag">UN REGALO · LUNA</span>
        </div>
        <div class="stage-copy">
          <p class="kicker">LUNA tiene algo para vos</p>
          <h1>Tu próximo look viene con regalo.</h1>
          <p class="lead">Descubrí una sorpresa pensada para hacer todavía mejor tu próxima compra.</p>
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
          <div class="share-gift-top"><span>LUNA</span><span>PARA COMPARTIR</span></div>
          <div class="share-seal"><span>L</span></div>
          <div class="share-gift-bottom">Hay un regalo esperando por vos.<br>Descubrilo en LUNA Atelier.</div>
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
        <p class="good-news">Los buenos looks también se comparten.</p>
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
    const message = `LUNA Atelier me dejó un regalo sorpresa ✨👗\nHay otro esperando por vos. Descubrilo acá: ${cleanUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    window.setTimeout(renderWheel, 650);
  }

  function wheelMarkup() {
    const labels = prizes.map((prize, index) => {
      const angle = index * 72 + 36;
      const darkClass = prize.darkLabel ? ' wheel-label-dark' : '';
      return `<span class="wheel-label${darkClass}" style="--a:${angle}deg"><b>${prize.wheelLabel}</b></span>`;
    }).join('');

    return `
      <div class="wheel-wrap">
        <span class="pointer" aria-hidden="true"></span>
        <div class="wheel">
          ${labels}
          <span class="wheel-center"><span>L</span><small>LUNA</small></span>
        </div>
      </div>`;
  }

  function renderWheel() {
    shell(`
      <div class="stage wheel-stage">
        <div class="stage-copy">
          <p class="kicker">✓ Regalo desbloqueado</p>
          <h1>Ahora sí. Descubrilo.</h1>
          <p class="lead">Tu beneficio te espera para tu próxima compra en LUNA Atelier.</p>
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
    const prize = prizes[index];
    selectedPrize = {
      name: prize.name,
      index,
      code: `LUNA-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
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
      name: prizes[0].name,
      code: `LUNA-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    };

    shell(`
      <div class="stage reward-stage">
        <div class="reward-burst" aria-hidden="true"><div class="reward-medal"><span>L</span></div></div>
        <div class="stage-copy">
          <p class="kicker">Este regalo es tuyo</p>
          <h1>${prize.name}</h1>
          <p class="lead">Guardá este voucher y presentalo en LUNA Atelier antes de la fecha de vencimiento.</p>
        </div>
        <article class="voucher" aria-label="Voucher de premio LUNA Atelier">
          <div class="voucher-top"><span class="voucher-brand">LUNA</span><span>REGALO VIRALIO</span></div>
          <div class="voucher-main">
            <div class="voucher-prize"><small>Tu beneficio</small><strong>${prize.name}</strong></div>
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
