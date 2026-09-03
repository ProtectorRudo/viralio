# Viralio — Cloud deployment

Viralio separa dos superficies:

- **GitHub Pages**: showroom estático bajo `showcase/`, sin datos reales.
- **Aplicación Viralio**: Next.js con servidor, PostgreSQL, alta de comercios, configuración y canje autenticado.

## Variables de entorno de producción

```text
NODE_ENV=production
VIRALIO_PERSISTENCE=postgres
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://app.example.com
VIRALIO_AUTH_SECRET=<secreto aleatorio de al menos 32 caracteres>
VIRALIO_ONBOARDING_KEY=<secreto distinto de al menos 24 caracteres>
VIRALIO_MERCHANT_PINS=<opcional; sólo comercios demo/configurados legacy>
```

Reglas:

- `DATABASE_URL`, `VIRALIO_AUTH_SECRET`, `VIRALIO_ONBOARDING_KEY` y PINs son secretos. Nunca deben guardarse en Git ni usar prefijo `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_APP_URL` sí es pública y en producción debe ser HTTPS.
- `VIRALIO_AUTH_SECRET` firma sesiones y participa en la derivación segura de credenciales de los comercios creados dinámicamente.
- `VIRALIO_ONBOARDING_KEY` protege `/alta` y el endpoint de provisionamiento. Debe ser distinta de `VIRALIO_AUTH_SECRET`.
- `VIRALIO_MERCHANT_PINS` ya no es obligatorio para comercios nuevos. Sólo mantiene acceso a comercios definidos por configuración, como demos. Si se usa, debe ser JSON `slug → PIN` numérico de 4 a 12 dígitos.

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
- settings por comercio;
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
- JSON de PINs legacy cuando exista;
- presencia de todas las tablas requeridas;
- RLS activo en todas esas tablas.

Un solo `FAIL` invalida la promoción. El preflight **no aplica migraciones automáticamente**.

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

La aplicación agrega headers de producción para reducir clickjacking, MIME sniffing, fuga de referrer y permisos innecesarios. Paneles, tokens y APIs transaccionales usan `Cache-Control: private, no-store`.

El CSP se mantiene compatible con Next/Web Share y se verifica en Chromium dentro de CI.

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

Nunca debe exponer host, usuario, password ni connection string.

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
- variables privadas: `VIRALIO_PERSISTENCE`, `DATABASE_URL`, `VIRALIO_AUTH_SECRET`, `VIRALIO_ONBOARDING_KEY`, y opcionalmente `VIRALIO_MERCHANT_PINS`;
- variable pública: `NEXT_PUBLIC_APP_URL`;
- migraciones ejecutadas explícitamente antes de promover código que depende de un esquema nuevo;
- `npm run preflight:production` obligatorio antes del smoke test final.

## Concurrencia

PostgreSQL protege las invariantes con locks y constraints:

- `SELECT ... FOR UPDATE` para sesión/reward;
- advisory lock transaccional para intentos concurrentes de login sobre un fingerprint todavía inexistente;
- unicidad de referral token, reward token, short code y reward por sesión.

## CI

GitHub Actions levanta PostgreSQL, parte de base vacía, aplica todas las migraciones, prueba concurrencia y ejecuta la aplicación productiva con Chromium. Las credenciales del CI son ficticias.

Gates mínimos:

- unit/integration;
- lint;
- typecheck;
- build;
- PostgreSQL real;
- E2E consumidor;
- E2E comercio/canje;
- E2E fuerza bruta;
- E2E headers/CSP.

## Gate antes del primer piloto comercial

Además de un CI verde y deploy HTTPS:

- repositorio privado;
- estrategia de backup/restore resuelta;
- secretos/PINs reales fuera de Git;
- smoke test vivo consumidor + comercio;
- revisar logs/runtime errors después del smoke;
- T&C/promoción y tratamiento de datos revisados para el piloto.
