import { describe, expect, test } from "bun:test";
import { renderSingleFrame } from "../lib/engine.js";
import type { SceneNode } from "../lib/types.js";

const GroupFilterScene = (): SceneNode => ({
  tag: "view",
  style: {
    width: 100, height: 100,
    backgroundColor: "#ffffff",
    blur: 10, // Group level blur
  },
  children: [
      {
          tag: "rect",
          style: {
              width: 50, height: 50,
              backgroundColor: "#ff0000",
              marginLeft: 25, marginTop: 25
          }
      }
  ]
});

describe("Group Filters", () => {
  test("applies blur to children in a group", async () => {
    const width = 100;
    const height = 100;
    
    const buffer = await renderSingleFrame(GroupFilterScene, { 
      width, height, fps: 30, duration: 1 
    }, 0, {});

    // Without blur, center (50,50) is RED (255,0,0)
    // With blur, red spreads to white area, and center red might mix with white background?
    // Wait, background is #ffffff. Red rect on top.
    // Blur blends Red and White.
    
    const cx = 50;
    const cy = 50;
    const centerIdx = (cy * width + cx) * 4;
    
    // Check if red channel is smeared
    // Original Red Rect at (25,25) to (75,75).
    // Center is solid red if no blur.
    
    // Check a pixel just outside the rect (e.g., 20, 50).
    // Without blur: White (255, 255, 255).
    // With blur: Should have some Red tint from the rect.
    
    const outIdx = (50 * width + 20) * 4;
    
    // Expect some red bleed
    // It's white bg, so R=255, G=255, B=255.
    // Red rect R=255, G=0, B=0.
    // Blurring Red onto White:
    // If we blur the whole layer (White BG + Red Rect):
    // The edge between Red and White will blur.
    
    // Actually, group has white bg. So the whole 100x100 is white with a red center.
    // If we blur, the red square blurs into the white.
    // Pixel at 20,50 (5px away from rect) should get some color change?
    // Wait, rect is 25 to 75. 20 is outside.
    // If we blur, the red color (255,0,0) spreads out.
    // But the background is white (255,255,255).
    // Blurring red (255,0,0) with white (255,255,255) results in light pink/red?
    // (255+255)/2 = 255 Red.
    // (0+255)/2 = 127 Green.
    // So distinctness drops.
    
    // Let's check a pixel *inside* the rect near the edge, e.g. 26, 50.
    // Without blur: 255, 0, 0.
    // With blur: It mixes with outside white -> G and B increase from 0.
    
    const edgeInnerIdx = (50 * width + 26) * 4;
    expect(buffer[edgeInnerIdx+1]).toBeGreaterThan(0); // Green component appears due to blur with white
    expect(buffer[edgeInnerIdx+2]).toBeGreaterThan(0); // Blue component appears
  });
});