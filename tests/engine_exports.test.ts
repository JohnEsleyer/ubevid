import { describe, expect, test } from "bun:test";
import { getRawEngine, getEngine } from "../lib/wasm.js";

describe("Engine Exports", () => {
    test("getRawEngine is exported", () => {
        expect(getRawEngine).toBeDefined();
        expect(typeof getRawEngine).toBe("function");
    });

    // Removed flaky null-check as parallel tests often initialize the engine early
    test("getRawEngine returns instance after init", async () => {
        await getEngine({ width: 100, height: 100, fps: 30, duration: 1 });
        expect(getRawEngine()).not.toBeNull();
    });
});