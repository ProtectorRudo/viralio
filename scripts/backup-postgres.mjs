import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to create a backup.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(databaseUrl);
} catch {
  console.error("DATABASE_URL is invalid.");
  process.exit(1);
}

if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
  console.error("DATABASE_URL must use postgres:// or postgresql://.");
  process.exit(1);
}

const stamp = new Date().toISOString().replaceAll(":", "-");
const requested = process.argv[2] ?? path.join("backups", `viralio-${stamp}.dump`);
const destination = path.resolve(requested);
await mkdir(path.dirname(destination), { recursive: true });

const childEnvironment = { ...process.env };
delete childEnvironment.DATABASE_URL;
childEnvironment.PGHOST = parsed.hostname;
childEnvironment.PGPORT = parsed.port || "5432";
childEnvironment.PGUSER = decodeURIComponent(parsed.username);
childEnvironment.PGPASSWORD = decodeURIComponent(parsed.password);
childEnvironment.PGDATABASE = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
const sslMode = parsed.searchParams.get("sslmode");
if (sslMode) childEnvironment.PGSSLMODE = sslMode;

const child = spawn("pg_dump", [
  "--format=custom",
  "--no-owner",
  "--no-acl",
  "--file",
  destination,
], {
  env: childEnvironment,
  stdio: "inherit",
});

const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});

if (exitCode !== 0) {
  console.error("Backup failed. No database credentials were printed.");
  process.exitCode = Number(exitCode);
} else {
  console.log(`Backup created at ${destination}`);
  console.log("Treat this dump as sensitive data and move it to encrypted private storage.");
}
