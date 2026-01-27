import { describe, expect, test } from "bun:test";
import { renderSingleFrame } from "../lib/engine.js";
import { getEngine } from "../lib/wasm.js";
import type { SceneNode } from "../lib/types.js";

// Mock 100x50 asset (2:1 aspect ratio)
const mockAssetWidth = 100;
const mockAssetHeight = 50;
const mockAsset = new Uint8Array(mockAssetWidth * mockAssetHeight * 4).fill(255); // White image

// Helper to create scene with specific fit
const FitScene = (fit: "cover" | "contain" | "fill"): SceneNode => ({
    tag: "image",
    src: "aspect_test",
    style: {
        width: 100, height: 100, // Square container (1:1)
        objectFit: fit as any,
        backgroundColor: "#000000" // Black background to detect gaps
    }
});

describe("Image Object Fit", () => {
    test("cover scales to fill square container", async () => {
        const width = 100, height = 100;
        const engine = await getEngine({ width, height, fps: 30, duration: 1 });
        engine.load_asset_raw("aspect_test", mockAsset, mockAssetWidth, mockAssetHeight);

        const buffer = await renderSingleFrame(() => FitScene("cover"), { width, height, fps: 30, duration: 1 }, 0, {});

        // 2:1 Image in 1:1 Container with COVER:
        // Height matches (100 vs 50 -> scale 2x)
        // New Width = 100 * 2 = 200.
        // Centered: -50 offset.
        // Center pixel (50, 50) should be white.
        const centerIdx = (50 * width + 50) * 4;
        expect(buffer[centerIdx]).toBe(255);

        // Edges should also be filled (no black bars for cover)
        const topIdx = (5 * width + 50) * 4; // Top middle
        expect(buffer[topIdx]).toBe(255); 
    });

    test("contain letterboxes wide image in square container", async () => {
        const width = 100, height = 100;
        const buffer = await renderSingleFrame(() => FitScene("contain"), { width, height, fps: 30, duration: 1 }, 0, {});

        // 2:1 Image in 1:1 Container with CONTAIN:
        // Width matches (100 vs 100 -> scale 1x)
        // New Height = 50 * 1 = 50.
        // Centered: 25px offset top/bottom.
        
        // Center pixel (50,50) should be white (image)
        const centerIdx = (50 * width + 50) * 4;
        expect(buffer[centerIdx]).toBe(255);

        // Top pixel (10, 50) should be black (letterbox)
        // Since we didn't explicitly set bg on the image node itself but the container is the image, 
        // effectively drawing transparent pixels if nothing is there.
        // Wait, image node draws the image. If we don't clear, it's transparent (0).
        // The mock asset is white (255).
        const topIdx = (10 * width + 50) * 4;
        expect(buffer[topIdx]).toBe(0); // Transparent/Black
    });
});