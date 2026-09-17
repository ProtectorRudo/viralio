import { describe, expect, it } from "vitest";
import { operationsPeriodStart } from "@/operations/merchant-operations";

describe("operations period filter", () => {
  const now = new Date("2026-09-17T14:15:00.000Z");

  it("uses Buenos Aires midnight for today", () => {
    expect(operationsPeriodStart("today", now)).toBe("2026-09-17T03:00:00.000Z");
  });

  it("uses rolling windows for 7 and 30 days", () => {
    expect(operationsPeriodStart("7d", now)).toBe("2026-09-10T14:15:00.000Z");
    expect(operationsPeriodStart("30d", now)).toBe("2026-08-18T14:15:00.000Z");
  });

  it("returns no boundary for all-time metrics", () => {
    expect(operationsPeriodStart("all", now)).toBeNull();
  });
});
