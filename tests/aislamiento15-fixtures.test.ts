import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { EMERGENCY_LAYOUT, canStand, findPath } from "../src/app/aislamiento-15/ChamberNavigation";

describe("AISLAMIENTO 15 — acceso al fusible F-08", () => {
  it("mantiene despejada la zona del tablero eléctrico", () => {
    expect(canStand(0, -4.25, -1.5, .32)).toBe(true);
    expect(canStand(0, EMERGENCY_LAYOUT.locker.x, EMERGENCY_LAYOUT.locker.z, .32)).toBe(false);
  });

  it("permite acercarse al extremo visible del mostrador para recoger el cartucho", () => {
    const approach = new THREE.Vector3(-1.75, 0, EMERGENCY_LAYOUT.fuse.z);
    expect(canStand(0, approach.x, approach.z, .32)).toBe(true);
    expect(canStand(0, EMERGENCY_LAYOUT.fuse.x, EMERGENCY_LAYOUT.fuse.z, .32)).toBe(false);
    const path = findPath(0, new THREE.Vector3(0, 0, 3.8), approach);
    expect(path.length).toBeGreaterThan(0);
    expect(path.every(point => canStand(0, point.x, point.z, .32))).toBe(true);
  });
});
