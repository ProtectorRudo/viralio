# Viralio

Experiencia mobile-first de recompensas compartibles para comercios. El flujo validado es:

**QR / landing → premio oculto → compartir → ruleta → premio → guardar en WhatsApp**.

Las experiencias reales de desarrollo son [Moka](http://localhost:3000/moka) y [Atlas Barber](http://localhost:3000/atlas-barber). Ambas ejecutan exactamente el mismo componente, endpoints y dominio; sólo cambia su configuración tipada.

## Dos superficies separadas

Viralio separa deliberadamente **showroom** y **producto real**.

### Showroom público — GitHub Pages

`showcase/` es un artefacto 100% estático pensado para ventas, revisión visual y demostraciones desde cualquier celular.

- portada con selector de demos;
- Moka y Atlas Barber;
- mismo motor JavaScript para ambas demos;
- flujo visual completo landing → share → ruleta → premio;
- Estado de WhatsApp e Instagram Stories visibles;
- ruleta demo de 9 vueltas;
- sin sesiones, rewards, analytics, canjes ni persistencia reales.

`.github/workflows/pages.yml` publica únicamente `showcase/`. El showroom nunca consume los endpoints sensibles del SaaS.

### Producto real — Next.js + PostgreSQL

`src/` contiene la aplicación real. Ahí viven sesiones, referrals, analytics, selección server-side de premios, tarjetas, WhatsApp y canje.

PostgreSQL es la persistencia durable de producción. JSON queda exclusivamente como modo local/desarrollo explícito. **Producción falla si no existe una configuración PostgreSQL válida**: nunca cae silenciosamente al filesystem.

## Ejecutar localmente

Requiere Node.js 24 LTS y npm 11 o superior.

```bash
npm ci
npm run dev
```

Sin configuración adicional, desarrollo usa `data/viralio.json`, ignorado por Git.

Para usar PostgreSQL:

```text
VIRALIO_PERSISTENCE=postgres
DATABASE_URL=postgres://...
```

Luego:

```bash
npm run migrate
npm run dev
```

Para probar el panel seguro de canjes también deben configurarse `VIRALIO_AUTH_SECRET` y `VIRALIO_MERCHANT_PINS`. Ver `.env.example` y `docs/CLOUD_DEPLOY.md`.

## Persistencia y concurrencia

La capa de aplicación depende de un contrato transaccional, no de arrays ni SQL directamente.

- `MemoryRepository`: tests puros, con rollback por copia y serialización.
- `JsonRepository`: desarrollo local, escritura atómica y serializada.
- `PostgresRepository`: producción, transacciones PostgreSQL reales y operaciones por fila.

Las invariantes críticas se protegen con `SELECT ... FOR UPDATE` y constraints de base:

- una recompensa máxima por sesión;
- un canje máximo por reward;
- tokens de referral/reward únicos;
- códigos cortos únicos;
- deduplicación de `reward_viewed` concurrente.

El premio sigue siendo seleccionado exclusivamente en `ViralioService.spin()`.

## Canje seguro

La tarjeta del cliente y la autoridad para canjear están separadas.

- `/premio/<token>` es público y **sólo lectura**;
- `/validar/<token>` es legacy y redirige a la tarjeta pública;
- no existe `PATCH /api/rewards/<token>`;
- el comercio opera desde `/comercio/<slug>/canjes`;
- el acceso usa PIN privado del comercio y una cookie de sesión firmada, HttpOnly y de 8 horas;
- el empleado busca el código corto visible del cliente;
- `redeemForMerchant(merchantId, shortCode)` valida pertenencia y bloquea el reward dentro de la transacción;
- una sesión de Moka no puede consultar ni canjear premios de Atlas, y viceversa;
- las escrituras sensibles exigen same-origin.

El token público del reward nunca funciona como credencial de escritura.

## Migraciones

`migrations/` contiene SQL versionado. `npm run migrate` crea `viralio_schema_migrations` y ejecuta sólo migraciones pendientes.

La aplicación nunca crea o modifica el esquema durante un request.

## Health / readiness

`GET /api/health` verifica la persistencia activa. En PostgreSQL ejecuta una consulta real y devuelve sólo estado, tipo de persistencia y reachability; nunca expone la connection string.

## Sistema de diseño

`src/app/globals.css` contiene el sistema estable de diseño, `src/app/viralio-003.css` aplica la capa de premium polish y `src/app/viralio-005.css` estiliza el panel seguro de comercio sin duplicar skins.

Los componentes consumen variables semánticas (`--color-primary`, `--color-surface`, etc.), nunca valores de comercio dispersos. `prefers-reduced-motion` elimina animaciones no esenciales y reduce el tiempo funcional del reveal.

## Theming por comercio

Cada entrada de `src/config/merchants.ts` contiene identidad, copy contextual, paleta semántica, segmentos de rueda, premios, probabilidades, vigencia y WhatsApp.

`merchantThemeStyle()` acepta únicamente colores hexadecimales de seis dígitos y usa fallback seguro ante valores inválidos. `MerchantExperience`, `RewardCard` y el panel de canjes heredan el theme del comercio sin duplicar el motor.

## Estados de WhatsApp e Instagram Stories

Viralio presenta cuatro destinos explícitos:

- **Estado de WhatsApp**;
- **Instagram Stories**;
- **Enviar por WhatsApp**;
- **Compartir por otras apps**.

Para Estado/Stories, la aplicación real genera una pieza social vertical **1080×1920 (9:16)** mediante `GET /api/share-card/[referralToken]` usando `ImageResponse` server-side. La tarjeta hereda el theme del comercio y nunca contiene el premio de quien comparte.

Si el navegador soporta `navigator.canShare({ files })`, se comparte el PNG. Si Web Share existe pero no admite archivos, se usa fallback de texto + referral URL. `whatsapp_status` e `instagram_story` representan intención de destino, no confirmación de publicación. Si el usuario cancela Web Share (`AbortError`), la ruleta no se desbloquea.

No existe ni se finge `share_published`.

## Ruleta premium

La rueda real es SVG y recibe el reward ya decidido por el servidor. Usa **9 vueltas completas equivalentes** y aproximadamente **4,1 s** de animación normal. El ángulo final se deriva exclusivamente de `reward.prizeId`.

## Arquitectura

- `src/domain`: state machine, probabilidades, estados y reglas puras.
- `src/application`: sesiones, referrals, analytics, emisión y canje merchant-scoped.
- `src/persistence`: contrato transaccional y adaptadores memory/JSON/PostgreSQL.
- `src/security`: autenticación y sesión firmada del comercio.
- `src/config`: tenants, skins y premios.
- `src/app/api`: validación server-side, health, auth, canjes y share card.
- `src/ui`: motor merchant-driven, rueda, tarjeta pública y panel de canjes.
- `migrations`: esquema PostgreSQL versionado.
- `showcase`: showroom estático sin backend.

## Verificación

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
node --check showcase/assets/app.js
```

Con PostgreSQL disponible:

```bash
npm run migrate
npm run test:postgres
```

GitHub Actions levanta PostgreSQL 16, aplica migraciones y ejecuta pruebas reales de concurrencia además de unit/integration, lint, typecheck, build y E2E Chromium. Los E2E de canje usan PINs y secreto ficticios exclusivos del CI.

## Limitaciones actuales

- Web Share no confirma publicación externa ni garantiza que WhatsApp Status o Instagram Stories sean el destino elegido.
- WhatsApp directo usa `wa.me`, no WhatsApp Business API. Los números de las demos son ficticios.
- La autenticación de comercio del primer piloto usa un PIN por comercio; todavía no incluye usuarios individuales, roles, 2FA ni recuperación de acceso.
- El showroom de GitHub Pages es deliberadamente visual y no representa datos, rewards ni métricas reales.
- El deploy efectivo a Vercel/Supabase requiere configurar secretos fuera del repositorio.
