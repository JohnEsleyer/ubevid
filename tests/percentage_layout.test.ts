import { describe, expect, test } from "bun:test";
import { renderSingleFrame } from "../lib/engine.js";
import type { SceneNode } from "../lib/types.js";

const PercentScene = (): SceneNode => ({
  tag: "view",
  style: {
    width: "100%", height: "100%",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center"
  },
  children: [
    {
        tag: "rect",
        style: {
            width: "50%", height: "50%",
            backgroundColor: "#ff0000"
        }
    }
  ]
});

describe("Percentage Layout", () => {
  test("fills parent based on percentage strings", async () => {
    const width = 100;
    const height = 100;
    
    const buffer = await renderSingleFrame(PercentScene, { 
      width, height, fps: 30, duration: 1 
    }, 0, {});

    // Center (50, 50) should be Red
    const centerIdx = (50 * width + 50) * 4;
    expect(buffer[centerIdx]).toBe(255); // R
    
    // Top-left (5, 5) should be White (outside the 50% centered child)
    const cornerIdx = (5 * width + 5) * 4;
    expect(buffer[cornerIdx]).toBe(255); // R
    expect(buffer[cornerIdx+1]).toBe(255); // G
    expect(buffer[cornerIdx+2]).toBe(255); // B
  });
});