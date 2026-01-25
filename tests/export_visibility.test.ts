import { describe, expect, test } from "bun:test";
import { renderSingleFrame, measurePath } from "../lib/engine.js";

describe("Engine Module Exports", () => {
  test("renderSingleFrame is accessible", () => {
    expect(renderSingleFrame).toBeDefined();
    expect(typeof renderSingleFrame).toBe("function");
  });

  test("measurePath is accessible", () => {
    expect(measurePath).toBeDefined();
    expect(typeof measurePath).toBe("function");
  });
});