# Viralio — prototipo Moka

Prototipo mobile-first del flujo **Compartí → Girá → Ganá** definido en [VIRALIO-001](https://github.com/ProtectorRudo/viralio/issues/1). La demo pública vive en `/moka`; no pide registro ni datos personales.

## Requisitos y ejecución

- Node.js 24 LTS (la aplicación también es compatible con las versiones soportadas por Next.js 16).
- npm 11 o superior.

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000/moka`. La primera ejecución crea `data/viralio.json`; el archivo de datos local está ignorado por Git. Para definir el origen usado en links compartidos puede copiarse `.env.example` a `.env.local`, aunque en navegador se usa el origen actual.

## Verificaciones

```bash
npm test
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

El E2E usa un viewport Pixel 7 y reemplaza exclusivamente el contrato del Web Share API, porque Playwright no puede operar el share sheet nativo. Comprueba que sólo se desbloquea después de que ese contrato se resuelve y nunca registra una publicación externa.

## Arquitectura

- `src/domain`: state machine, probabilidades, estados y reglas puras, sin dependencia de React.
- `src/application`: casos de uso transaccionales para sesiones, sharing, referrals, emisión/canje y analytics.
- `src/persistence`: interfaz `Repository` y adaptadores JSON/memoria. El adaptador puede sustituirse por PostgreSQL sin cambiar el dominio.
- `src/config`: configuración multi-tenant centralizada; VIRALIO-001 sólo registra Moka.
- `src/app/api`: endpoints server-side que validan cada transición sensible.
- `src/ui`: experiencia mobile-first y tarjeta/validador de premio.

Las sesiones, referrals, rewards y códigos usan tokens criptográficos no secuenciales. Las escrituras JSON se serializan y reemplazan atómicamente. El giro y el canje se resuelven dentro de una transacción server-side; reintentar o refrescar devuelve el mismo premio y un reward canjeado no vuelve a cambiar.

## Datos demo

Moka se configura una sola vez en `src/config/merchants.ts`:

| Premio | Probabilidad |
| --- | ---: |
| Upgrade de café | 35% |
| Medialuna gratis en tu próxima visita | 30% |
| 10% en tu próxima visita | 20% |
| Café gratis | 14% |
| Premio especial Moka | 1% |

Los premios vencen a los 7 días. El teléfono `5491100000000` es el número ficticio configurado para la demo y debe reemplazarse por el del comercio en una puesta real.

## Decisiones y limitaciones conocidas

- La persistencia JSON es deliberadamente local/dev: es durable entre reinicios y suficiente para una única instancia, pero no coordina múltiples procesos o despliegues serverless. La interfaz de repositorio marca el límite de migración a PostgreSQL.
- Web Share sólo aparece si `navigator.share` está disponible. El navegador/plataforma controla el share sheet y no brinda confirmación verificable de una Story; Viralio registra `share_initiated`, nunca `share_published`.
- WhatsApp usa enlaces `wa.me` con texto precompletado, no WhatsApp Business API. Instagram/redes se ofrecen mediante el share sheet nativo cuando existe; la web no puede publicar directamente ni confirmar una publicación.
- El validador demo está en `/validar/<token>` y no tiene autenticación de empleados, conforme al alcance del issue. En producción ese acceso deberá protegerse.
- No se atribuye compra física: el lenguaje y la medición se limitan a visita/participación.

## Flujo manual sugerido

1. Entrar a `/moka` y tocar **Descubrir mi premio**.
2. Iniciar WhatsApp o el share sheet. La ruleta no existe antes de este paso.
3. Girar, refrescar y comprobar que el premio persiste.
4. Abrir **Guardar premio en WhatsApp** y revisar comercio, premio, código, vencimiento y link de tarjeta.
5. Abrir `/premio/<token>` y `/validar/<token>`; canjear una vez y comprobar los estados `AVAILABLE`, `REDEEMED` y, con una fecha vencida en datos de desarrollo, `EXPIRED`.
