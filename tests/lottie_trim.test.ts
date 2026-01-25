import { describe, expect, test, mock } from "bun:test";
import { lottieToScene } from "../lib/lottie/index.js";
import type { LottieJSON } from "../lib/lottie/types.js";

mock.module("../lib/engine.js", () => {
    return {
        measurePath: () => 100, // Always return 100px length
        getRawEngine: () => ({})
    };
});

describe("Lottie Trim Path", () => {
  const mockLottie: LottieJSON = {
    fr: 30, ip: 0, op: 60, w: 100, h: 100,
    layers: [{
      ind: 1, ty: 4, st: 0, op: 60,
      ks: {
          a: { a: 0, k: [0,0] }, p: { a: 0, k: [0,0] },
          s: { a: 0, k: [100,100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }
      },
      shapes: [
          // Stroke
          { ty: "st", c: { a: 0, k: [1, 0, 0] }, w: { a: 0, k: 5 } },
          // Trim Path: Start 10%, End 90%
          { ty: "tm", s: { a: 0, k: 10 }, e: { a: 0, k: 90 }, o: { a: 0, k: 0 } },
          // Shape with explicit empty tangents to verify correct Lottie structure
          { ty: "sh", ks: { a: 0, k: { v: [[0,0],[10,10]], i:[[0,0],[0,0]], o:[[0,0],[0,0]], c: false } } }
      ]
    }]
  };

  test("applies stroke dash array based on trim properties", () => {
    const scene = lottieToScene(mockLottie, 0);
    const layer = scene.children?.[0];
    const shape = layer?.children?.[0];
    
    expect(shape).toBeDefined();
    expect(shape?.tag).toBe("path");
    
    // We mocked measurePath to return 100.
    // Start 10% = 10. End 90% = 90.
    // Visible = 80.
    // Offset = -10.
    
    expect(shape?.style.strokeDashArray).toEqual([80, 100]);
    expect(shape?.style.strokeDashOffset).toBe(-10);
    expect(shape?.style.borderWidth).toBe(5);
  });
});