# Viralio

Experiencia mobile-first de recompensas compartibles para comercios. El flujo validado es:

**QR / landing → premio oculto → compartir → ruleta → premio → guardar en WhatsApp**.

Las experiencias reales de desarrollo son [Moka](http://localhost:3000/moka) y [Atlas Barber](http://localhost:3000/atlas-barber). Ambas ejecutan exactamente el mismo componente, endpoints y dominio; sólo cambia su configuración tipada.

## Dos superficies separadas

Viralio separa deliberadamente **showroom** y **producto real**:

### Showroom público — GitHub Pages

`showcase/` es un artefacto 100% estático pensado para ventas, revisión visual y demostraciones desde cualquier celular.

- portada con selector de demos;
- Moka y Atlas Barber;
- mismo motor JavaScript para ambas demos;
- flujo visual completo landing → share → ruleta → premio;
- Estado de WhatsApp e Instagram Stories visibles;
- ruleta demo de 9 vueltas;
- sin sesiones, rewards, analytics, canjes ni persistencia reales.

`.github/workflows/pages.yml` publica **únicamente `showcase/`** en GitHub Pages. El showroom nunca consume los endpoints sensibles del SaaS.

### Producto real — Next.js + servidor

`src/` contiene la aplicación real. Ahí viven las sesiones, referrals, analytics, selección server-side de premios, tarjetas, WhatsApp y canje. La etapa cloud migrará la persistencia JSON a PostgreSQL/Supabase y desplegará esta superficie en infraestructura con backend.

## Ejecutar localmente

Requiere Node.js 24 LTS y npm 11 o superior.

```bash
npm ci
npm run dev
```

La primera sesión crea `data/viralio.json`, ignorado por Git. `.env.example` documenta el origen público opcional; en el navegador se usa siempre el origen actual.

## Sistema de diseño

`src/app/globals.css` contiene el sistema estable de diseño y `src/app/viralio-003.css` aplica la capa de premium polish de VIRALIO-003 sin duplicar el motor de componentes.

Los componentes consumen variables semánticas (`--color-primary`, `--color-surface`, etc.), nunca valores de comercio dispersos. `prefers-reduced-motion` elimina animaciones no esenciales y reduce el tiempo funcional del reveal.

## Theming por comercio

Cada entrada de `src/config/merchants.ts` contiene identidad, copy contextual, paleta semántica, segmentos de rueda, premios, probabilidades, vigencia y WhatsApp.

`merchantThemeStyle()` acepta únicamente colores hexadecimales de seis dígitos y usa fallback seguro ante valores inválidos. `MerchantExperience` renderiza el flujo entero y `RewardCard` hereda el comercio del reward server-side.

No se copia ni modifica el motor React para cada comercio. La selección del premio ocurre únicamente en `ViralioService.spin()`.

## Estados de WhatsApp e Instagram Stories

VIRALIO-003 presenta cuatro destinos explícitos:

- **Estado de WhatsApp**;
- **Instagram Stories**;
- **Enviar por WhatsApp**;
- **Compartir por otras apps**.

Para Estado/Stories, la aplicación real genera una pieza social vertical **1080×1920 (9:16)** mediante `GET /api/share-card/[referralToken]` usando `ImageResponse` server-side. La tarjeta hereda el theme del comercio y nunca contiene el premio de quien comparte.

Si el navegador soporta `navigator.canShare({ files })`, se comparte el PNG. Si Web Share existe pero no admite archivos, se usa fallback de texto + referral URL. `whatsapp_status` e `instagram_story` representan intención de destino, no confirmación de publicación. Si el usuario cancela Web Share (`AbortError`), la ruleta no se desbloquea.

No existe ni se finge `share_published`.

## Ruleta premium

La rueda real es SVG, muestra los premios configurados y recibe el reward ya decidido por el servidor. VIRALIO-003 usa **9 vueltas completas equivalentes** y aproximadamente **4,1 s** de animación normal. El ángulo final se deriva exclusivamente de `reward.prizeId`.

Con `prefers-reduced-motion`, la animación se elimina sin cambiar el resultado.

## Arquitectura y seguridad del flujo

- `src/domain`: state machine, probabilidades, estados y reglas puras.
- `src/application`: sesiones, referrals, analytics, contexto seguro de share, emisión y canje.
- `src/persistence`: contrato de repositorio y adaptadores JSON/memoria.
- `src/config`: tenants, skins y premios.
- `src/app/api`: validación server-side y generación de share card.
- `src/ui`: motor merchant-driven, rueda premium y tarjeta pública.
- `showcase`: showroom estático sin backend.

Una sesión real sólo obtiene un reward, el refresh recupera el mismo y un canje no puede repetirse. Tokens y códigos son criptográficos y no secuenciales.

## Verificación

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
node --check showcase/assets/app.js
```

GitHub Actions ejecuta unit/integration, lint, typecheck, build y E2E Chromium en PRs. El workflow de Pages valida además la estructura del showroom y la sintaxis de su motor JavaScript antes de desplegar.

## Limitaciones actuales

- Web Share no confirma publicación externa ni garantiza que WhatsApp Status o Instagram Stories sean el destino elegido.
- WhatsApp directo usa `wa.me`, no WhatsApp Business API. Los números de ambas demos reales son ficticios.
- La persistencia JSON actual es para una sola instancia local/demo. El contrato `Repository` es el límite previsto para PostgreSQL/Supabase.
- `/validar/<token>` sigue siendo un validador demo sin autenticación de empleados. Debe protegerse antes de un piloto comercial real.
- El showroom de GitHub Pages es deliberadamente visual y no representa datos, rewards ni métricas reales.
