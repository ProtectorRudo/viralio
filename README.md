# Viralio

Experiencia mobile-first de recompensas compartibles para comercios. El flujo validado es:

**QR / landing → premio oculto → compartir → ruleta → premio → guardar en WhatsApp**.

Las demos son [Moka](http://localhost:3000/moka), una cafetería cálida y sofisticada, y [Atlas Barber](http://localhost:3000/atlas-barber), una barbería urbana. Ambas ejecutan exactamente el mismo componente, endpoints y dominio; sólo cambia su configuración tipada.

## Ejecutar localmente

Requiere Node.js 24 LTS y npm 11 o superior.

```bash
npm ci
npm run dev
```

La primera sesión crea `data/viralio.json`, ignorado por Git. `.env.example` documenta el origen público opcional; en el navegador se usa siempre el origen actual.

## Sistema de diseño

`src/app/globals.css` contiene el sistema estable de diseño y `src/app/viralio-003.css` aplica la capa de premium polish de VIRALIO-003 sin duplicar el motor de componentes.

Los tokens cubren:

- spacing y tipografía;
- radios, surfaces y sombras;
- duraciones y curvas de motion;
- focus visible;
- estados success, warning y error;
- layout y componentes compartidos.

Los componentes consumen variables semánticas (`--color-primary`, `--color-surface`, etc.), nunca valores de comercio dispersos. `prefers-reduced-motion` elimina animaciones no esenciales y reduce el tiempo funcional del reveal.

## Theming por comercio

Cada entrada de `src/config/merchants.ts` tiene dominio y skin:

- identidad: `displayName`, `shortName`, `monogram` y categoría;
- copy contextual para landing, share, referral y pieza social;
- paleta semántica completa;
- colores de segmentos;
- premios, probabilidades, vigencia y WhatsApp.

`merchantThemeStyle()` acepta únicamente colores hexadecimales de seis dígitos y usa fallback seguro ante valores inválidos. Los valores se aplican como custom properties a la raíz de la experiencia; no se inyecta CSS ni HTML arbitrario. `MerchantExperience` renderiza el flujo entero y `RewardCard` hereda el comercio del reward server-side.

### Agregar otra demo

1. Agregar un `Merchant` en `src/config/merchants.ts`; sus probabilidades deben sumar 100.
2. Crear una ruta delgada como `src/app/atlas-barber/page.tsx` que busque el slug y renderice `<MerchantExperience merchant={merchant} />`.
3. Agregar metadata propia y un smoke E2E.

No se copia ni modifica el motor React. La selección del premio sigue ocurriendo únicamente en `ViralioService.spin()`.

## Estados de WhatsApp e Instagram Stories

VIRALIO-003 vuelve a presentar cuatro destinos explícitos en la pantalla crítica de share:

- **Estado de WhatsApp**;
- **Instagram Stories**;
- **Enviar por WhatsApp**;
- **Compartir por otras apps**.

Para Estado/Stories, Viralio genera una pieza social vertical **1080×1920 (9:16)** mediante `GET /api/share-card/[referralToken]` usando `ImageResponse` del lado servidor. La tarjeta:

- hereda el theme del comercio;
- nunca contiene el premio de quien comparte;
- incluye copy de misterio, branding del comercio y Viralio;
- incluye el referral URL;
- se genera sólo a partir de un referral token válido existente.

Si el navegador soporta `navigator.canShare({ files })`, se comparte el PNG. Si Web Share existe pero no permite archivos, se usa fallback de texto + referral URL. Si no existe Web Share, la UI informa una alternativa y el envío directo por WhatsApp sigue disponible.

Viralio **no puede elegir ni confirmar el destino final dentro del share sheet del teléfono**. `whatsapp_status` e `instagram_story` son intención de destino, no confirmación de publicación. Si el usuario cancela Web Share (`AbortError`), la ruleta no se desbloquea.

Analytics mantiene únicamente:

- `share_channel_selected`;
- `share_initiated`;
- `wheel_unlocked`.

No existe ni se finge `share_published`.

## Ruleta premium

La rueda es SVG, muestra los premios reales configurados y recibe el reward ya decidido por el servidor. VIRALIO-003 usa **9 vueltas completas equivalentes** y aproximadamente **4,1 s** de animación normal, con aceleración/desaceleración visual más marcada. El ángulo final sigue derivándose exclusivamente de `reward.prizeId`.

Con `prefers-reduced-motion`, la animación se elimina y el reveal ocurre en un intervalo muy breve, sin cambiar el resultado.

## Arquitectura y seguridad del flujo

- `src/domain`: state machine, probabilidades, estados y reglas puras.
- `src/application`: sesiones, referrals, analytics, contexto seguro de share, emisión y canje transaccionales.
- `src/persistence`: contrato de repositorio y adaptadores JSON/memoria.
- `src/config`: tenants, skins y premios.
- `src/app/api`: validación server-side de cada transición sensible y generación de share card.
- `src/ui`: motor merchant-driven, rueda premium SVG y tarjeta pública.

Una sesión sólo obtiene un reward, el refresh recupera el mismo y un canje no puede repetirse. Tokens y códigos son criptográficos y no secuenciales.

## Verificación

```bash
npm test
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

La suite E2E cubre Moka completo, persistencia, WhatsApp, coincidencia rueda/servidor, opciones Status/Stories, share con archivos, fallback sin archivos, cancelación, Atlas y su reward card, reduced motion, y ausencia de overflow en 360×800, 390×844, 412×915, 430×932 y 1280×800. Web Share se reemplaza únicamente en el límite del navegador, porque Playwright no puede operar el share sheet real del sistema operativo.

GitHub Actions ejecuta en pushes a `main` y PRs: `npm ci`, tests unit/integration, lint sin warnings, typecheck y build. E2E queda como verificación local obligatoria mientras dependa de Chromium y persistencia JSON local.

## Limitaciones actuales

- Web Share no confirma publicación externa ni permite a una PWA web garantizar que WhatsApp Status o Instagram Stories sean el destino elegido.
- WhatsApp directo usa `wa.me`, no WhatsApp Business API. Los números de ambas demos son ficticios.
- La persistencia JSON es para una sola instancia local/demo. El contrato `Repository` es el límite previsto para PostgreSQL/Supabase en la etapa cloud.
- `/validar/<token>` es un validador demo sin autenticación de empleados. Debe protegerse antes de un piloto comercial real.
- La tarjeta pública es presentable y tematizada, pero la fuente de verdad del estado continúa siendo server-side.
