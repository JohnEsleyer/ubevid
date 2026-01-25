import { describe, expect, test } from "bun:test";
import { renderSingleFrame } from "../lib/engine.js";
import type { SceneNode } from "../lib/types.js";

const LuminanceScene = (): SceneNode => ({
  tag: "view",
  style: {
    width: 100, height: 100,
    backgroundColor: "#ffffff",
    maskMode: "luminance"
  },
  mask: {
    tag: "view",
    style: {
      width: 100, height: 100,
      backgroundGradient: {
        type: "linear",
        colors: ["#000000", "#ffffff"], // Black to White gradient
        angle: 90
      }
    }
  }
});

describe("Luminance Masking", () => {
  test("luminance mask transparency scales with brightness", async () => {
    const buffer = await renderSingleFrame(LuminanceScene, { 
      width: 100, height: 100, fps: 30, duration: 1 
    }, 0, {});

    // Left side (Mask is Black) -> Invisible
    expect(buffer[0 + 3]).toBeLessThan(5);

    // Right side (Mask is White) -> Near Opaque
    // Note: Pixel at x=95 in a 100px linear gradient is ~242 intensity.
    const rightSideIdx = (50 * 100 + 95) * 4;
    expect(buffer[rightSideIdx + 3]).toBeGreaterThan(240);
  });
});