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

VIRALIO-004 incorpora PostgreSQL como persistencia durable. JSON queda exclusivamente como modo local/desarrollo explícito. **Producción falla si no existe una configuración PostgreSQL válida**: nunca cae silenciosamente al filesystem.

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

Ver `docs/CLOUD_DEPLOY.md` para Supabase/Vercel y operación cloud.

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

## Migraciones

`migrations/` contiene SQL versionado. `npm run migrate` crea `viralio_schema_migrations` y ejecuta sólo migraciones pendientes.

La aplicación nunca crea o modifica el esquema durante un request.

## Health / readiness

`GET /api/health` verifica la persistencia activa. En PostgreSQL ejecuta una consulta real y devuelve sólo estado, tipo de persistencia y reachability; nunca expone la connection string.

## Sistema de diseño

`src/app/globals.css` contiene el sistema estable de diseño y `src/app/viralio-003.css` aplica la capa de premium polish de VIRALIO-003 sin duplicar el motor de componentes.

Los componentes consumen variables semánticas (`--color-primary`, `--color-surface`, etc.), nunca valores de comercio dispersos. `prefers-reduced-motion` elimina animaciones no esenciales y reduce el tiempo funcional del reveal.

## Theming por comercio

Cada entrada de `src/config/merchants.ts` contiene identidad, copy contextual, paleta semántica, segmentos de rueda, premios, probabilidades, vigencia y WhatsApp.

`merchantThemeStyle()` acepta únicamente colores hexadecimales de seis dígitos y usa fallback seguro ante valores inválidos. `MerchantExperience` renderiza el flujo entero y `RewardCard` hereda el comercio del reward server-side.

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

La rueda real es SVG y recibe el reward ya decidido por el servidor. VIRALIO-003 usa **9 vueltas completas equivalentes** y aproximadamente **4,1 s** de animación normal. El ángulo final se deriva exclusivamente de `reward.prizeId`.

## Arquitectura

- `src/domain`: state machine, probabilidades, estados y reglas puras.
- `src/application`: sesiones, referrals, analytics, contexto de share, emisión y canje.
- `src/persistence`: contrato transaccional y adaptadores memory/JSON/PostgreSQL.
- `src/config`: tenants, skins y premios.
- `src/app/api`: validación server-side, health y generación de share card.
- `src/ui`: motor merchant-driven, rueda premium y tarjeta pública.
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

GitHub Actions levanta una instancia limpia de PostgreSQL 16, aplica migraciones y ejecuta pruebas reales de concurrencia además de unit/integration, lint, typecheck, build y E2E Chromium.

## Limitaciones actuales

- Web Share no confirma publicación externa ni garantiza que WhatsApp Status o Instagram Stories sean el destino elegido.
- WhatsApp directo usa `wa.me`, no WhatsApp Business API. Los números de las demos son ficticios.
- `/validar/<token>` sigue siendo un validador demo sin autenticación y comparte la credencial pública del reward. **VIRALIO-005 debe corregir esto antes de cualquier piloto real.**
- El showroom de GitHub Pages es deliberadamente visual y no representa datos, rewards ni métricas reales.
- El deploy efectivo a Vercel/Supabase requiere configurar secretos fuera del repositorio.
