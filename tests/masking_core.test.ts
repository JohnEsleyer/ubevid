import { describe, expect, test } from "bun:test";
import { renderSingleFrame } from "../lib/engine.js";
import type { SceneNode } from "../lib/types.js";

// A scene with a red square masked by a circle
// The circle mask should make corners transparent
const MaskedScene = (): SceneNode => ({
  tag: "view",
  style: {
    width: 100, height: 100,
    backgroundColor: "#ff0000", // RED
  },
  mask: {
    tag: "circle",
    style: {
        width: 100, height: 100,
        backgroundColor: "#ffffff" // Mask opaque area
    }
  }
});

describe("Core Masking", () => {
  test("applies node mask to content", async () => {
    const width = 100;
    const height = 100;
    
    const buffer = await renderSingleFrame(MaskedScene, { 
      width, height, fps: 30, duration: 1 
    }, 0, {});

    // Center pixel should be red (visible)
    const cx = 50;
    const cy = 50;
    const centerIdx = (cy * width + cx) * 4;
    expect(buffer[centerIdx]).toBe(255); // R
    expect(buffer[centerIdx+3]).toBe(255); // A

    // Corner pixel (0,0) should be masked out (transparent)
    // because circle mask doesn't cover corners
    const cornerIdx = 0;
    // TinySkia anti-aliasing might give small alpha, but essentially transparent
    expect(buffer[cornerIdx+3]).toBeLessThan(10); 
  });
});