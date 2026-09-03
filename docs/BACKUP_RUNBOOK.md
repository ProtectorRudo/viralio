# Viralio — Backup runbook

## Contexto

El proyecto productivo puede usar Supabase Free durante desarrollo y piloto técnico, pero no se debe asumir que ese plan ofrece una política de backups accesibles equivalente a Pro/Team/Enterprise.

Antes de tráfico comercial real debe cumplirse al menos una de estas opciones:

1. subir Supabase a un plan con backups diarios gestionados adecuados para el riesgo del piloto; o
2. ejecutar backups lógicos off-site de forma periódica y probar restauración.

## Crear un backup lógico

Requisitos:

- PostgreSQL client tools instalados (`pg_dump` compatible con la versión del servidor);
- `DATABASE_URL` disponible sólo como secreto del entorno;
- destino local temporal fuera de Git.

Ejemplo:

```bash
node scripts/backup-postgres.mjs
```

También puede indicarse un destino explícito:

```bash
node scripts/backup-postgres.mjs /ruta/privada/viralio.dump
```

El script no pasa `DATABASE_URL` en la línea de comandos de `pg_dump`: separa la URL y entrega las credenciales mediante variables `PG*` al proceso hijo. No imprime contraseña ni connection string.

## Tratamiento del archivo

Un `.dump` contiene datos de producción y debe considerarse sensible.

- Nunca hacer commit del dump.
- Nunca adjuntarlo a un issue o PR.
- Nunca subirlo a un bucket público.
- Guardarlo únicamente en almacenamiento privado y cifrado.
- Eliminar la copia temporal local luego de verificar la carga off-site.
- Mantener una política de retención definida antes del piloto comercial.

`backups/` y `*.dump` están ignorados por Git para reducir errores humanos.

## Verificación de restauración

Un backup que nunca fue restaurado no se considera validado. Antes del primer piloto comercial:

1. crear un proyecto/base PostgreSQL descartable;
2. restaurar el dump con `pg_restore`;
3. comprobar migraciones/tablas;
4. comprobar conteos de `sessions`, `rewards`, `analytics_events`, `merchant_accounts` y `merchant_settings`;
5. ejecutar un smoke test de lectura;
6. destruir el entorno descartable.

## Automatización futura

Cuando exista un destino privado definitivo, automatizar:

- ejecución diaria o según RPO acordado;
- cifrado antes de transferencia si el destino no cifra del lado cliente;
- carga off-site;
- verificación de tamaño/hash;
- retención;
- alerta ante fallo;
- restauración de prueba periódica.

No guardar `DATABASE_URL`, claves de cifrado ni credenciales del destino en el repositorio. Deben vivir en secretos del runtime/CI correspondiente.
