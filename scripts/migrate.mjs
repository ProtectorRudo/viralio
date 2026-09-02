import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const migrationsDirectory = path.join(process.cwd(), "migrations");
const sql = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
  idle_timeout: 5,
  onnotice: () => undefined,
});

try {
  await sql`
    CREATE TABLE IF NOT EXISTS viralio_schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const files = (await readdir(migrationsDirectory))
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort();

  for (const file of files) {
    const [alreadyApplied] = await sql`
      SELECT version FROM viralio_schema_migrations WHERE version = ${file}
    `;
    if (alreadyApplied) continue;

    const migration = await readFile(path.join(migrationsDirectory, file), "utf8");
    await sql.begin(async (transaction) => {
      await transaction.unsafe(migration);
      await transaction`
        INSERT INTO viralio_schema_migrations (version) VALUES (${file})
      `;
    });
    console.log(`Applied migration ${file}`);
  }
} catch (error) {
  console.error("Migration failed without exposing database credentials.");
  if (process.env.MIGRATION_DEBUG === "1") console.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
