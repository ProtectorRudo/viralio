import { describe, expect, it } from "vitest";
import { resolvePersistenceConfig } from "@/persistence/persistence-config";

describe("persistence configuration", () => {
  it("defaults to JSON outside production", () => {
    expect(resolvePersistenceConfig({ NODE_ENV: "development" })).toEqual({ kind: "json" });
  });

  it("requires PostgreSQL in production", () => {
    expect(() => resolvePersistenceConfig({ NODE_ENV: "production", VIRALIO_PERSISTENCE: "json" }))
      .toThrow(/Production requires postgres/);
  });

  it("does not allow an implicit production database without DATABASE_URL", () => {
    expect(() => resolvePersistenceConfig({ NODE_ENV: "production" })).toThrow(/DATABASE_URL/);
  });

  it("accepts a standard PostgreSQL connection string", () => {
    const databaseUrl = "postgres://viralio:secret@db.example.test:5432/viralio?sslmode=require";
    expect(resolvePersistenceConfig({
      NODE_ENV: "production",
      VIRALIO_PERSISTENCE: "postgres",
      DATABASE_URL: databaseUrl,
    })).toEqual({ kind: "postgres", databaseUrl });
  });

  it("rejects unknown persistence modes without echoing credentials", () => {
    expect(() => resolvePersistenceConfig({
      NODE_ENV: "development",
      VIRALIO_PERSISTENCE: "filesystem-plus",
      DATABASE_URL: "postgres://user:very-secret@example.test/db",
    })).toThrow("VIRALIO_PERSISTENCE must be either json or postgres");
  });
});
