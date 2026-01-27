import { describe, expect, test } from "bun:test";
import { getEngine, getHardwareReport } from "../lib/wasm.js";

describe("Crystalline Hardware Bridge", () => {
  test("engine correctly reports hardware capabilities", async () => {
    const config = { width: 100, height: 100, fps: 30, duration: 1 };
    await getEngine(config);
    
    const report = getHardwareReport();
    
    expect(report).toBeDefined();
    expect(["gpu", "cpu"]).toContain(report.mode);
    expect(typeof report.device).toBe("string");
  });
});