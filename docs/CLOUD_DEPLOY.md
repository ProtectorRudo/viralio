# Viralio — Cloud deployment

Viralio separa dos superficies:

- **GitHub Pages**: showroom estático bajo `showcase/`, sin datos reales.
- **Aplicación Viralio**: Next.js con servidor, PostgreSQL, alta de comercios, Brand Engine, configuración y canje autenticado.

## Variables de entorno de producción

```text
NODE_ENV=production
VIRALIO_PERSISTENCE=postgres
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://app.example.com
VIRALIO_AUTH_SECRET=<secreto aleatorio de al menos 32 caracteres>
VIRALIO_ONBOARDING_KEY=<secreto distinto de al menos 24 caracteres>
OPENAI_API_KEY=<API key server-side de OpenAI>
OPENAI_BRAND_MODEL=gpt-5.6-terra
VIRALIO_MERCHANT_PINS=<opcional; sólo comercios demo/configurados legacy>
```

Reglas:

- `DATABASE_URL`, `VIRALIO_AUTH_SECRET`, `VIRALIO_ONBOARDING_KEY`, `OPENAI_API_KEY` y PINs son secretos. Nunca deben guardarse en Git ni usar prefijo `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_APP_URL` sí es pública y en producción debe ser HTTPS.
- `VIRALIO_AUTH_SECRET` firma sesiones y participa en la derivación segura de credenciales de los comercios creados dinámicamente.
- `VIRALIO_ONBOARDING_KEY` protege `/alta` y los endpoints de provisionamiento/Brand AI. Debe ser distinta de `VIRALIO_AUTH_SECRET`.
- `OPENAI_BRAND_MODEL` no es secreto. El default es `gpt-5.6-terra`; puede cambiarse sin tocar código.
- `VIRALIO_MERCHANT_PINS` ya no es obligatorio para comercios nuevos. Sólo mantiene acceso a comercios definidos por configuración, como demos. Si se usa, debe ser JSON `slug → PIN` numérico de 4 a 12 dígitos.

## Brand Engine + OpenAI

El análisis de marca ocurre durante el alta, no durante las visitas del consumidor.

Flujo:

1. operador carga nombre, rubro, brief y opcionalmente logo;
2. `/api/onboarding/brand-preview` llama a OpenAI desde el servidor;
3. OpenAI devuelve un draft estructurado de estilo, tipografía, tono, colores y copy;
4. Viralio valida el draft y deriva localmente contraste, hover, superficies, estados y colores de ruleta;
5. el operador aprueba el draft;
6. la identidad se persiste dentro de `merchant_settings` JSONB junto con la campaña;
7. funnel, premio y share card 9:16 renderizan esa identidad sin nuevas llamadas de IA.

Seguridad/privacidad:

- la API key nunca llega al navegador;
- Responses API se usa con `store: false`;
- Structured Outputs usa `json_schema` con `strict: true`;
- la IA no emite HTML/CSS arbitrario ni puede modificar premios, probabilidades, canje o credenciales;
- logos inline admitidos: PNG/JPEG/WebP, con límite estricto de tamaño; SVG y URLs externas no se aceptan;
- si OpenAI está temporalmente caído, el alta manual/template sigue siendo posible;
- no existe llamada a OpenAI en el request path del consumidor ni al generar cada share.

## Preparar la base

1. Crear PostgreSQL administrado.
2. Definir `DATABASE_URL` sólo en un entorno seguro.
3. Ejecutar:

```bash
npm ci
npm run migrate
```

El migrador aplica `migrations/*.sql` en orden y registra el esquema cuando se ejecuta mediante el migrador de Viralio. La aplicación no modifica el esquema durante requests.

El esquema actual incluye:

- sesiones, rewards y analytics;
- settings por comercio, incluyendo Brand Profile;
- cuentas dinámicas de comercio con PIN derivado mediante scrypt;
- throttle persistente del login.

Todas las tablas de aplicación expuestas en `public` deben tener RLS habilitado sin policies públicas mientras Viralio acceda exclusivamente por la conexión PostgreSQL privada del backend.

## Preflight obligatorio

Antes de promover un deployment a producción:

```bash
npm run preflight:production
```

El preflight comprueba sin imprimir valores sensibles:

- persistencia PostgreSQL;
- sintaxis de `DATABASE_URL` y conexión real;
- URL pública HTTPS y no-local;
- fortaleza/separación de secretos;
- presencia de configuración server-side de OpenAI para Brand Engine;
- JSON de PINs legacy cuando exista;
- presencia de todas las tablas requeridas;
- RLS activo en todas esas tablas.

Un solo `FAIL` invalida la promoción. El preflight **no aplica migraciones automáticamente** ni hace llamadas pagas a OpenAI.

## Canje seguro

- `/premio/<token>` es público y sólo lectura.
- `/validar/<token>` redirige a la tarjeta pública y no otorga autoridad de canje.
- no existe escritura pública mediante `PATCH /api/rewards/<token>`.
- el comercio entra por `/comercio/<slug>/canjes`.
- la sesión se guarda en cookie firmada `HttpOnly`, `SameSite=Strict`, `Secure` en producción, TTL máximo 8 h.
- escrituras sensibles exigen `Origin` same-origin.
- el lookup/canje queda limitado al `merchantId` autenticado.
- PostgreSQL serializa el canje y evita dobles redenciones.

## Protección contra fuerza bruta

El login de comercio mantiene throttle compartido en PostgreSQL:

- 5 fallos dentro de 10 minutos;
- bloqueo de 15 minutos;
- respuesta `429` con `Retry-After`;
- fingerprint HMAC por comercio + cliente;
- no se persiste la IP en claro;
- un login exitoso limpia el historial de ese comercio/cliente;
- comercios/clientes distintos no comparten el bloqueo.

En Vercel, la IP se toma del `x-forwarded-for` normalizado por la plataforma.

## Seguridad HTTP

La aplicación agrega headers de producción para reducir clickjacking, MIME sniffing, fuga de referrer y permisos innecesarios. Paneles, tokens y APIs transaccionales/onboarding usan `Cache-Control: private, no-store`.

El CSP se mantiene compatible con Next/Web Share y sólo permite imágenes desde `self`, `data:` y `blob:`; se verifica en Chromium dentro de CI.

## Health check

```text
GET /api/health
```

Respuesta sana esperada:

```json
{
  "status": "ok",
  "persistence": "postgres",
  "databaseReachable": true,
  "app": "viralio"
}
```

Nunca debe exponer host, usuario, password, connection string ni configuración de OpenAI.

## Supabase

Supabase se usa en esta etapa como PostgreSQL administrado. El dominio no depende de APIs propietarias de Supabase.

Proyecto productivo actual: región `sa-east-1` para cercanía con Argentina.

### Backups

No asumir que **Supabase Free** ofrece el mismo acceso/retención de backups que planes pagos. Antes de tráfico comercial real debe existir una de estas dos garantías:

1. plan con backups gestionados adecuados; o
2. backup lógico off-site automatizado y restauración probada.

Viralio incluye:

```bash
node scripts/backup-postgres.mjs
```

Ver `docs/BACKUP_RUNBOOK.md`. Los `.dump` son sensibles y están excluidos de Git.

## Vercel

Configuración esperada:

- Framework: Next.js;
- Install: `npm ci`;
- Build: `npm run build`;
- branch de producción: `main`;
- variables privadas: `VIRALIO_PERSISTENCE`, `DATABASE_URL`, `VIRALIO_AUTH_SECRET`, `VIRALIO_ONBOARDING_KEY`, `OPENAI_API_KEY`, y opcionalmente `VIRALIO_MERCHANT_PINS`;
- variables no secretas: `NEXT_PUBLIC_APP_URL` y opcionalmente `OPENAI_BRAND_MODEL`;
- migraciones ejecutadas explícitamente antes de promover código que depende de un esquema nuevo;
- `npm run preflight:production` obligatorio antes del smoke test final.

## Concurrencia

PostgreSQL protege las invariantes con locks y constraints:

- `SELECT ... FOR UPDATE` para sesión/reward;
- advisory lock transaccional para intentos concurrentes de login sobre un fingerprint todavía inexistente;
- unicidad de referral token, reward token, short code y reward por sesión.

Los tests de integración que comparten una única base efímera de CI se ejecutan sin paralelismo entre archivos para evitar que sus `TRUNCATE` de aislamiento interfieran entre sí.

## CI

GitHub Actions levanta PostgreSQL, parte de base vacía, aplica todas las migraciones, prueba concurrencia y ejecuta la aplicación productiva con Chromium. Las credenciales del CI son ficticias y la prueba de OpenAI usa mocks: CI no realiza llamadas pagas a la API.

Gates mínimos:

- unit/integration;
- lint;
- typecheck;
- build;
- PostgreSQL real;
- Brand Engine y persistencia de Brand Profile;
- E2E consumidor;
- E2E comercio/canje;
- E2E fuerza bruta;
- E2E headers/CSP;
- E2E de comercio branded + share card 9:16.

## Gate antes del primer piloto comercial

Además de un CI verde y deploy HTTPS:

- repositorio privado;
- estrategia de backup/restore resuelta;
- secretos/PINs/API key reales fuera de Git;
- smoke test vivo consumidor + comercio;
- prueba real controlada del Brand Engine con una marca y logo reales;
- revisar logs/runtime errors después del smoke;
- T&C/promoción y tratamiento de datos revisados para el piloto.
