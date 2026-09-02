import { describe, expect, it } from "vitest";
import { canRecordEvent, transition } from "@/domain/flow";

describe("flow state machine", () => {
  it("follows landing → unlock → share → reward", () => {
    const unlocked = transition("LANDING", "unlock_viewed");
    const shared = transition(unlocked, "share_initiated");
    expect(transition(shared, "wheel_spun")).toBe("REWARDED");
  });
  it("rejects impossible transitions and analytics ordering", () => {
    expect(() => transition("LANDING", "wheel_spun")).toThrow(/invalid/);
    expect(canRecordEvent("LANDING", "whatsapp_save_clicked")).toBe(false);
    expect(canRecordEvent("REWARDED", "whatsapp_save_clicked")).toBe(true);
  });
});
