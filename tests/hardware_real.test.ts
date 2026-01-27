import { describe, expect, test } from "bun:test";
import { getEngine, getHardwareReport } from "../lib/wasm.js";

describe("Real Hardware Detection", () => {
  test("reports non-fallback device on capable hardware", async () => {
    const config = { width: 100, height: 100, fps: 30, duration: 1 };
    await getEngine(config);
    
    const report = getHardwareReport();
    
    console.log(`Detected: ${report.device} (${report.mode})`);
    
    // On most dev machines, this should NOT be "Unknown"
    expect(report.device).not.toContain("Unknown");
    expect(typeof report.mode).toBe("string");
  });
});
