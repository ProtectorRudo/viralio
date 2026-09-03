import { describe, expect, it } from "vitest";
import { validateProductionDatabase } from "../scripts/production-preflight.mjs";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;

describePostgres("production preflight database gate", () => {
  it("accepts the fully migrated PostgreSQL schema with RLS enabled", async () => {
    const checks = await validateProductionDatabase(databaseUrl);
    expect(checks).toEqual([
      { name: "database connection succeeds", ok: true },
      { name: "required tables are present", ok: true },
      { name: "RLS is enabled on required tables", ok: true },
    ]);
  });
});
