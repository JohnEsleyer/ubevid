import { describe, expect, test } from "bun:test";
import { bezierToPath, lottieColorToHex } from "../lib/lottie/converter.ts";

describe("Lottie Utilities", () => {
  test("converts lottie color array to hex", () => {
    expect(lottieColorToHex([1, 0, 0])).toBe("#ff0000");
    expect(lottieColorToHex([0, 1, 0])).toBe("#00ff00");
    expect(lottieColorToHex([0.5, 0.5, 0.5])).toBe("#7f7f7f");
  });

  test("converts bezier data to SVG path", () => {
    const mockBezier = {
      v: [[0, 0], [100, 100]] as [number, number][],
      i: [[0, 0], [-10, 0]] as [number, number][],
      o: [[10, 0], [0, 0]] as [number, number][],
      c: true
    };
    const path = bezierToPath(mockBezier);
    
    expect(path).toContain("M 0,0");
    expect(path).toContain("C 10,0 90,100 100,100");
    expect(path).toContain("Z");
  });
});