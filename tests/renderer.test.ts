import { describe, expect, test, beforeAll } from "bun:test";
import { renderSingleFrame } from "../lib/engine.js";
import type { SceneNode } from "../lib/types.js";

// A simple scene component for testing
// Explicitly typing return as SceneNode fixes TS errors regarding 'tag' string inference
const TestScene = (props: { color: string }): SceneNode => ({
  tag: "view",
  style: {
    width: 10, height: 10,
    backgroundColor: props.color,
  }
});

const LayoutScene = (): SceneNode => ({
  tag: "view",
  style: { width: 20, height: 10, flexDirection: "row" },
  children: [
    { tag: "view", style: { width: 10, height: 10, backgroundColor: "#ff0000" } }, // Red (Left)
    { tag: "view", style: { width: 10, height: 10, backgroundColor: "#0000ff" } }  // Blue (Right)
  ]
});

describe("Core Renderer", () => {
  // We need to ensure wasm is built before running this, 
  // but we assume `wasm-pack build` has run.

  test("initializes and renders a solid color", async () => {
    const width = 10;
    const height = 10;
    
    // Render a Red Box
    const buffer = await renderSingleFrame(TestScene, { 
      width, height, fps: 30, duration: 1 
    }, 0, { color: "#ff0000" });

    // Output is RGBA (4 bytes per pixel)
    expect(buffer.length).toBe(width * height * 4);

    // Check first pixel (0,0)
    // R=255, G=0, B=0, A=255
    expect(buffer[0]).toBe(255); // R
    expect(buffer[1]).toBe(0);   // G
    expect(buffer[2]).toBe(0);   // B
    expect(buffer[3]).toBe(255); // A
  });

  test("handles flexbox layout correctly", async () => {
    const width = 20;
    const height = 10;
    
    const buffer = await renderSingleFrame(LayoutScene, { 
      width, height, fps: 30, duration: 1 
    }, 0, {});

    // Check pixel at (0, 0) -> Should be Red
    expect(buffer[0]).toBe(255);
    expect(buffer[2]).toBe(0);

    // Check pixel at (15, 0) -> Should be Blue (Right side)
    // Index = (y * width + x) * 4
    const index = (0 * width + 15) * 4;
    expect(buffer[index]).toBe(0);   // R
    expect(buffer[index + 2]).toBe(255); // B
  });

  test("supports opacity", async () => {
    const OpacityScene = (): SceneNode => ({
      tag: "view",
      style: { width: 10, height: 10, backgroundColor: "#ffffff", opacity: 0.5 }
    });

    const buffer = await renderSingleFrame(OpacityScene, { 
        width: 10, height: 10, fps: 30, duration: 1 
    }, 0, {});

    // White at 50% opacity on transparent background (pre-multiplied in TinySkia typically, 
    // but the final RGBA output from the engine depends on how we blit).
    
    // 0.5 * 255 ~= 127
    // Since background is transparent, we expect (127, 127, 127, 127) roughly.
    expect(buffer[0]).toBeGreaterThan(120);
    expect(buffer[0]).toBeLessThan(135);
    expect(buffer[3]).toBeGreaterThan(120);
  });
  
  test("svg path parser relative commands", async () => {
     const PathScene = (): SceneNode => ({
        tag: "view",
        style: { width: 100, height: 100, backgroundColor: "#000" },
        children: [{
            tag: "path",
            d: "M 0 0 l 10 10", // Relative line to
            style: { borderWidth: 1, borderColor: "#fff" }
        }]
     });
     
     // This test mostly ensures the Rust side doesn't panic on 'l' command
     const buffer = await renderSingleFrame(PathScene, { 
        width: 100, height: 100, fps: 30, duration: 1 
     }, 0, {});
     
     expect(buffer.length).toBe(100 * 100 * 4);
  });
});