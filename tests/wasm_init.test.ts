import { describe, expect, test } from "bun:test";
import { getEngine } from "../lib/wasm.js";

describe("Wasm Infrastructure", () => {
  test("Initialization does not throw with modern API", async () => {
    const config = { width: 100, height: 100, fps: 30, duration: 1 };
    
    // This will trigger getEngine which now uses the new init pattern
    const engine = await getEngine(config);
    expect(engine).toBeDefined();
    expect(typeof engine.render).toBe("function");
  });
});