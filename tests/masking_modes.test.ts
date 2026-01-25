import { describe, expect, test } from "bun:test";
import { renderSingleFrame } from "../lib/engine.js";
import type { SceneNode } from "../lib/types.js";

const InvertedMaskScene = (): SceneNode => ({
  tag: "view",
  style: {
    width: 100, height: 100,
    backgroundColor: "#ff0000", // Full Red
    maskMode: "alphaInverted"
  },
  mask: {
    tag: "rect",
    style: {
      width: 50, height: 50,
      marginLeft: 25, marginTop: 25, // Centered 50x50 mask
      backgroundColor: "#ffffff"
    }
  }
});

describe("Advanced Masking", () => {
  test("alphaInverted mask hides pixels where mask is opaque", async () => {
    const width = 100;
    const height = 100;

    const buffer = await renderSingleFrame(InvertedMaskScene, { 
      width, height, fps: 30, duration: 1 
    }, 0, {});

    // Corner (0,0) is outside the 50x50 centered rect.
    // Mask Alpha at (0,0) is 0.
    // Inverted Alpha is 255.
    // Red channel should be 255.
    const cornerIdx = 0;
    expect(buffer[cornerIdx]).toBe(255);
    expect(buffer[cornerIdx + 3]).toBe(255);

    // Center (50,50) is inside the 50x50 centered rect.
    // Mask Alpha at (50,50) is 255.
    // Inverted Alpha is 0.
    // Result should be fully transparent.
    const cx = 50;
    const cy = 50;
    const centerIdx = (cy * width + cx) * 4;
    expect(buffer[centerIdx + 3]).toBe(0);
  });
});