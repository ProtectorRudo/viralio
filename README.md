# Viralio

Experiencia mobile-first de recompensas compartibles para comercios. El flujo validado es:

**QR / landing → premio oculto → compartir → ruleta → premio → guardar en WhatsApp**.

Las demos públicas son [Moka](http://localhost:3000/moka), una cafetería cálida y sofisticada, y [Atlas Barber](http://localhost:3000/atlas-barber), una barbería urbana. Ambas ejecutan exactamente el mismo componente, endpoints y dominio; sólo cambia su configuración tipada.

## Ejecutar localmente

Requiere Node.js 24 LTS y npm 11 o superior.

```bash
npm ci
npm run dev
```

La primera sesión crea `data/viralio.json`, ignorado por Git. `.env.example` documenta el origen público opcional; en el navegador se usa siempre el origen actual.

## Sistema de diseño

`src/app/globals.css` define tokens neutrales y reutilizables para:

- escala de spacing y tipografía;
- radios, surfaces y sombras;
- duraciones y curvas de motion;
- focus visible;
- estados success, warning y error;
- layout y componentes compartidos.

Los componentes consumen variables semánticas (`--color-primary`, `--color-surface`, etc.), nunca colores de un comercio. `prefers-reduced-motion` elimina transiciones no esenciales y el motor reduce también la espera funcional del reveal. La rueda es SVG: expone una descripción accesible con todos los premios y no depende sólo del color.

## Theming por comercio

Cada entrada de `src/config/merchants.ts` tiene dominio y skin:

- identidad: `displayName`, `shortName`, `monogram` y categoría;
- copy contextual para landing, share y referral;
- paleta semántica completa;
- colores de segmentos;
- premios, probabilidades, vigencia y WhatsApp.

`merchantThemeStyle()` acepta únicamente colores hexadecimales de seis dígitos y usa un fallback seguro ante cualquier valor inválido. Los valores se aplican como custom properties a la raíz de la experiencia; no se inyecta CSS ni HTML arbitrario. `MerchantExperience` renderiza el flujo entero y `RewardCard` hereda el comercio del reward server-side.

### Agregar otra demo

1. Agregar un `Merchant` en `src/config/merchants.ts`; sus probabilidades deben sumar 100.
2. Crear una ruta delgada como `src/app/atlas-barber/page.tsx` que busque el slug y renderice `<MerchantExperience merchant={merchant} />`.
3. Agregar metadata propia y un smoke E2E.

No se copia ni modifica el motor React. La selección del premio sigue ocurriendo únicamente en `ViralioService.spin()`.

## Arquitectura y seguridad del flujo

- `src/domain`: state machine, probabilidades, estados y reglas puras.
- `src/application`: sesiones, referrals, analytics, emisión y canje transaccionales.
- `src/persistence`: contrato de repositorio y adaptadores JSON/memoria.
- `src/config`: tenants, skins y premios.
- `src/app/api`: validación server-side de cada transición sensible.
- `src/ui`: motor merchant-driven, rueda premium SVG y tarjeta pública.

La rueda recibe el reward decidido por el servidor, ubica el segmento de `prizeId` bajo el puntero y recién entonces presenta la animación. Nunca calcula ni elige un premio. Una sesión sólo obtiene un reward, el refresh recupera el mismo y un canje no puede repetirse. Tokens y códigos son criptográficos y no secuenciales.

## Verificación

```bash
npm test
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

La suite E2E cubre Moka completo, persistencia, WhatsApp, coincidencia rueda/servidor, Atlas y su reward card, reduced motion, y ausencia de overflow en 360×800, 390×844, 412×915, 430×932 y 1280×800. Web Share se reemplaza sólo en el límite del navegador, porque Playwright no puede operar el share sheet del sistema.

GitHub Actions ejecuta en pushes a `main` y PRs: `npm ci`, tests unit/integration, lint sin warnings, typecheck y build. E2E queda como verificación local obligatoria: depende de Chromium y de un servidor con persistencia JSON local; excluirlo evita sumar descarga y variabilidad de browser a una CI que debe permanecer rápida, mientras el contrato crítico está cubierto por tests de servicio en CI.

## Share externo y otras limitaciones

- Viralio registra `share_initiated` cuando se resuelve Web Share o cuando se abre WhatsApp. Los navegadores y redes no ofrecen confirmación verificable de publicación; la UI no afirma que exista.
- WhatsApp usa `wa.me` con texto precompletado, no WhatsApp Business API. Los números de ambas demos son ficticios.
- La persistencia JSON es para una sola instancia local/demo. El contrato `Repository` es el límite previsto para una base transaccional productiva.
- `/validar/<token>` es un validador demo sin autenticación de empleados, acorde al alcance actual. Debe protegerse en producción.
- La tarjeta pública es presentable y tematizada, pero la fuente de verdad del estado continúa siendo server-side.
