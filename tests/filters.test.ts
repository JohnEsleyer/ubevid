import { describe, expect, test } from "bun:test";
import { renderSingleFrame } from "../lib/engine.js";
import type { SceneNode } from "../lib/types.js";

const FilterScene = (): SceneNode => ({
  tag: "view",
  style: {
    width: 100, height: 100,
    backgroundColor: "#ffffff",
  },
  children: [
    {
        tag: "image",
        src: "missing_asset",
        style: {
            width: 50, height: 50,
            invert: 1.0,
            sepia: 0.5
        }
    }
  ]
});

describe("Filter System", () => {
  test("renders scene with new filter properties without error", async () => {
    const buffer = await renderSingleFrame(FilterScene, { 
      width: 100, height: 100, fps: 30, duration: 1 
    }, 0, {});

    expect(buffer.length).toBe(100 * 100 * 4);
  });
});
