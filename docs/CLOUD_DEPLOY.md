# Viralio — Cloud deployment

VIRALIO-004 separa definitivamente dos superficies:

- **GitHub Pages**: showroom estático bajo `showcase/`, sin datos reales.
- **Aplicación Viralio**: Next.js con servidor y PostgreSQL.

## Variables de entorno

Producción requiere:

```text
NODE_ENV=production
VIRALIO_PERSISTENCE=postgres
DATABASE_URL=postgres://...
NEXT_PUBLIC_APP_URL=https://app.example.com
```

`DATABASE_URL` acepta una connection string PostgreSQL estándar, incluida una URL de Supabase Postgres. Nunca debe guardarse en Git.

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
- Production env: `VIRALIO_PERSISTENCE=postgres`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`;
- migraciones: ejecutar `npm run migrate` de forma explícita antes de promover un esquema nuevo.

El pool de Postgres.js se mantiene deliberadamente pequeño para un runtime serverless. La instancia se reutiliza dentro del proceso mediante el singleton de persistencia.

## Concurrencia

PostgreSQL protege las invariantes críticas de Viralio en dos niveles:

1. `SELECT ... FOR UPDATE` serializa operaciones sobre la misma sesión/recompensa.
2. Constraints únicos impiden estados imposibles incluso ante una carrera inesperada:
   - `sessions.referral_token`;
   - `rewards.token`;
   - `rewards.short_code`;
   - `rewards.session_id` (un reward por sesión).

`reward_viewed` cuenta con un índice único parcial para deduplicar vistas concurrentes.

## CI

GitHub Actions levanta `postgres:16-alpine`, crea una base vacía, ejecuta las migraciones y prueba concurrencia real de spin/redeem. No se usa una base Supabase externa durante CI.

## Recuperación / rollback

Las migraciones se consideran forward-only durante el MVP. Ante una migración fallida:

1. no desplegar el código que depende de ella;
2. revisar el archivo SQL fallido;
3. restaurar desde backup si una migración ya confirmada produjo un cambio no reversible;
4. crear una nueva migración correctiva, en lugar de editar silenciosamente una migración ya aplicada en producción.

Antes de un piloto real deben existir backups automáticos del proveedor PostgreSQL.

## Próximo bloqueo antes del piloto

VIRALIO-004 resuelve persistencia durable, pero **no autoriza todavía un piloto comercial real**. VIRALIO-005 debe separar el token público del premio de la credencial de canje y proteger el flujo del empleado/comercio.
