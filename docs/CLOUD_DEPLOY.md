# Viralio — Cloud deployment

Viralio separa definitivamente dos superficies:

- **GitHub Pages**: showroom estático bajo `showcase/`, sin datos reales.
- **Aplicación Viralio**: Next.js con servidor, PostgreSQL y canje autenticado del comercio.

## Variables de entorno

Producción requiere:

```text
NODE_ENV=production
VIRALIO_PERSISTENCE=postgres
DATABASE_URL=postgres://...
NEXT_PUBLIC_APP_URL=https://app.example.com
VIRALIO_AUTH_SECRET=<secreto aleatorio de al menos 32 caracteres>
VIRALIO_MERCHANT_PINS={"moka":"<PIN_REAL>","atlas-barber":"<PIN_REAL>"}
```

`DATABASE_URL` acepta una connection string PostgreSQL estándar, incluida una URL de Supabase Postgres. Nunca debe guardarse en Git.

`VIRALIO_AUTH_SECRET` firma las sesiones de comercio mediante HMAC. Cambiar este secreto invalida todas las sesiones de comercio vigentes, lo cual también sirve como revocación global de emergencia.

`VIRALIO_MERCHANT_PINS` es un objeto JSON `slug → PIN` de 4 a 12 dígitos. Los valores reales deben existir únicamente como secretos/variables privadas del proveedor de despliegue. **Nunca usar `NEXT_PUBLIC_` para el secreto ni los PINs.**

En desarrollo local, si `VIRALIO_PERSISTENCE` se omite, se usa JSON. Para probar PostgreSQL localmente se puede definir explícitamente `VIRALIO_PERSISTENCE=postgres` y `DATABASE_URL`.

## Crear / preparar la base

1. Crear una base PostgreSQL vacía.
2. Definir `DATABASE_URL` sólo en el entorno seguro donde se ejecutará la migración.
3. Ejecutar:

```bash
npm ci
npm run migrate
```

El migrador crea `viralio_schema_migrations` y aplica los archivos de `migrations/` en orden. Una migración aplicada no se ejecuta de nuevo.

La aplicación **no modifica el esquema durante requests**.

## Canje seguro del comercio

VIRALIO-005 separa por diseño la tarjeta pública del cliente de la autoridad de canje.

- `/premio/<token>` es público y de sólo lectura.
- `/validar/<token>` es una ruta legacy que redirige a la tarjeta pública y no tiene capacidad de canje.
- `PATCH /api/rewards/<token>` no existe.
- el comercio ingresa a `/comercio/<slug>/canjes`;
- el acceso exige el PIN privado de ese comercio;
- una sesión válida se guarda en una cookie firmada `HttpOnly`, `SameSite=Strict`, `Secure` en producción y con una duración máxima de 8 horas;
- el empleado busca el código corto visible del cliente y confirma el canje desde el panel;
- la sesión de un comercio no puede consultar ni canjear rewards de otro comercio;
- las escrituras sensibles exigen además un `Origin` same-origin.

El token público del reward **nunca es una credencial de escritura**.

## Verificación

Con la aplicación levantada:

```text
GET /api/health
```

Respuesta sana esperada en producción:

```json
{
  "status": "ok",
  "persistence": "postgres",
  "databaseReachable": true,
  "app": "viralio"
}
```

El endpoint no expone host, usuario, password ni connection string.

## Supabase

Supabase se utiliza sólo como proveedor de PostgreSQL en esta etapa. Viralio no depende de APIs propietarias de Supabase para el dominio, por lo que la base puede migrarse a otro PostgreSQL compatible.

Recomendaciones:

- usar la connection string indicada para workloads server-side;
- exigir SSL cuando el proveedor lo requiera;
- guardar `DATABASE_URL` como secreto del entorno;
- aplicar migraciones fuera del request path;
- no utilizar el filesystem del runtime como fuente de verdad.

## Vercel

Configuración esperada:

- Framework: Next.js;
- Install: `npm ci`;
- Build: `npm run build`;
- Production env: `VIRALIO_PERSISTENCE`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `VIRALIO_AUTH_SECRET`, `VIRALIO_MERCHANT_PINS`;
- migraciones: ejecutar `npm run migrate` de forma explícita antes de promover un esquema nuevo.

El pool de Postgres.js se mantiene deliberadamente pequeño para un runtime serverless. La instancia se reutiliza dentro del proceso mediante el singleton de persistencia.

## Concurrencia

PostgreSQL protege las invariantes críticas de Viralio en dos niveles:

1. `SELECT ... FOR UPDATE` serializa operaciones sobre la misma sesión/recompensa, incluido el canje por código corto.
2. Constraints únicos impiden estados imposibles incluso ante una carrera inesperada:
   - `sessions.referral_token`;
   - `rewards.token`;
   - `rewards.short_code`;
   - `rewards.session_id` (un reward por sesión).

`reward_viewed` cuenta con un índice único parcial para deduplicar vistas concurrentes.

## CI

GitHub Actions levanta `postgres:16-alpine`, crea una base vacía, ejecuta migraciones y prueba concurrencia real de spin/redeem. Los E2E ejecutan la aplicación de producción contra PostgreSQL y usan únicamente credenciales ficticias exclusivas del CI.

La suite de seguridad debe verificar, entre otros puntos:

- token público sin poder de canje;
- PIN incorrecto rechazado;
- cookie manipulada o vencida rechazada;
- aislamiento Moka/Atlas;
- doble canje concurrente imposible;
- login → búsqueda por código → canje → logout en navegador móvil.

## Rotación y recuperación

Si un PIN se compromete:

1. cambiar sólo el PIN del slug afectado en `VIRALIO_MERCHANT_PINS`;
2. redesplegar/reiniciar el entorno para que tome la nueva configuración;
3. si también se desea invalidar inmediatamente todas las sesiones activas, rotar `VIRALIO_AUTH_SECRET`.

Las migraciones se consideran forward-only durante el MVP. Ante una migración fallida:

1. no desplegar el código que depende de ella;
2. revisar el archivo SQL fallido;
3. restaurar desde backup si una migración ya confirmada produjo un cambio no reversible;
4. crear una nueva migración correctiva, en lugar de editar silenciosamente una migración ya aplicada en producción.

Antes de un piloto real deben existir backups automáticos del proveedor PostgreSQL.

## Alcance del acceso comercial actual

El PIN por comercio es deliberadamente una autenticación mínima para el primer piloto. Todavía no implementa usuarios individuales, roles, 2FA ni recuperación de acceso. Esas capacidades pueden incorporarse sin volver a otorgar capacidad de escritura al token público del cliente.
