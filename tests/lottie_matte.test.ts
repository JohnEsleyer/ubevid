import { describe, expect, test, mock } from "bun:test";
import { lottieToScene } from "../lib/lottie/index.js";
import type { LottieJSON } from "../lib/lottie/types.js";

// Mock engine dependencies
mock.module("../lib/engine.js", () => ({
    measurePath: () => 100,
    getRawEngine: () => ({})
}));

describe("Lottie Track Mattes", () => {
    // Setup: Layer 1 (Mask) sits above Layer 2 (Content) in the JSON list.
    // Layer 2 defines 'tt: 1', meaning "Use Layer 1 as my mask".
    const mockLottie: LottieJSON = {
        fr: 30, ip: 0, op: 60, w: 100, h: 100,
        layers: [
            // Layer 0: The Mask (Circle)
            {
                ind: 1, ty: 4, st: 0, op: 60,
                ks: {
                    a: {a:0, k:[0,0]}, p: {a:0, k:[0,0]}, s: {a:0, k:[100,100]}, r: {a:0, k:0}, o: {a:0, k:100}
                },
                shapes: [
                    // Fill required for simple parser to render the rect
                    { ty: "fl", c: {a:0,k:[1,1,1]} },
                    { ty: "rc", s: {a:0,k:[50,50]}, p: {a:0,k:[0,0]}, r: {a:0,k:0} }
                ]
            },
            // Layer 1: The Content (Rect) with tt: 1
            {
                ind: 2, ty: 4, st: 0, op: 60,
                tt: 1, // Uses Layer 0
                ks: {
                    a: {a:0, k:[0,0]}, p: {a:0, k:[0,0]}, s: {a:0, k:[100,100]}, r: {a:0, k:0}, o: {a:0, k:100}
                },
                shapes: [{ ty: "fl", c: {a:0,k:[1,0,0]} }, { ty: "rc", s: {a:0,k:[100,100]}, p: {a:0,k:[0,0]}, r: {a:0,k:0} }]
            }
        ]
    };

    test("assigns previous layer as mask node", () => {
        const scene = lottieToScene(mockLottie, 0);
        
        // In visual order (reverse of JSON), we usually iterate Bottom -> Top.
        // lottieToScene iterates reverse (1 -> 0).
        // It hits Layer 1 (Content). Finds tt=1. Looks at Layer 0 (Mask).
        // Assigns Layer 0 as mask. Marks Layer 0 processed.
        // Pushes Layer 1 to children.
        // Next loop i=0, but processed.
        
        expect(scene.children?.length).toBe(1);
        
        const contentNode = scene.children![0];
        
        // Check if content is correct
        expect(contentNode.children?.length).toBe(1); // The rect
        
        // Check if mask is attached
        expect(contentNode.mask).toBeDefined();
        
        // Verify mask properties
        const maskNode = contentNode.mask!;
        expect(maskNode.children?.length).toBe(1);
        // The mask shape was a rect [50,50]
        expect(maskNode.children![0].style.width).toBe(50);
    });
});