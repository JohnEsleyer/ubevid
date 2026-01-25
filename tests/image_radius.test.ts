import { describe, expect, test, mock } from "bun:test"; import { renderSingleFrame } from "../lib/engine.js"; import type { SceneNode } from "../lib/types.js";

const mockAsset = new Uint8Array(50 * 50 * 4).fill(255);

mock.module("../lib/wasm.js", () => { return { getEngine: async () => { const { UbeEngine } = await import("../core/pkg/ubevid_core.js"); const engine = UbeEngine.new(); engine.load_asset_raw("whitebox", mockAsset, 50, 50); return engine; }, getRawEngine: () => ({}) }; });

const RoundedImageScene = (): SceneNode => { return { tag: "image", src: "whitebox", style: { width: 50, height: 50, borderRadius: 25, } }; };

describe("Image Rendering", () => { test("applies border radius clipping to image", async () => { const width = 50; const height = 50;

const buffer = await renderSingleFrame(RoundedImageScene, { 
  width, height, fps: 30, duration: 1 
}, 0, {});

const centerIdx = (25 * width + 25) * 4;
expect(buffer[centerIdx]).toBe(255); 
expect(buffer[centerIdx+3]).toBe(255);

const cornerIdx = 0;
expect(buffer[cornerIdx+3]).toBe(0); 
}); });

