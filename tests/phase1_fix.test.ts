import { describe, expect, test } from "bun:test";
import os from "node:os";

describe("Phase 1 Fixes", () => {
  test("node:os provides CPU info", () => {
    const cpus = os.cpus();
    expect(cpus.length).toBeGreaterThan(0);
  });

  test("measurePath is exported correctly", async () => {
    const engine = await import("../lib/engine.ts");
    expect(engine.measurePath).toBeDefined();
    expect(typeof engine.measurePath).toBe("function");
  });
});
