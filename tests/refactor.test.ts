import { describe, expect, test } from "bun:test";
import { renderSingleFrame } from "../lib/engine.js";
import type { SceneNode } from "../lib/types.js";

const EllipseScene = (): SceneNode => ({
  tag: "ellipse",
  style: {
    width: 20, height: 10,
    backgroundColor: "#ff0000",
  }
});

describe("Refactored Core", () => {
  test("renders ellipse primitive correctly", async () => {
    const width = 20;
    const height = 10;
    
    const buffer = await renderSingleFrame(EllipseScene, { 
      width, height, fps: 30, duration: 1 
    }, 0, {});

    // Center pixel should be red
    const cx = 10;
    const cy = 5;
    const index = (cy * width + cx) * 4;
    expect(buffer[index]).toBe(255); // R
    expect(buffer[index + 3]).toBe(255); // A
    
    // Corner pixel should be transparent (oval shape)
    // (0,0)
    expect(buffer[3]).toBe(0);
  });
});