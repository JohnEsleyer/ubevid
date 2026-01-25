import { describe, expect, test, mock } from "bun:test";
import { lottieToScene } from "../lib/lottie/index.js";
import type { LottieJSON } from "../lib/lottie/types.js";

// Mock engine dependencies to avoid loading Wasm in unit tests
mock.module("../lib/engine.js", () => ({
    measurePath: () => 100,
    getRawEngine: () => ({})
}));

describe("Lottie Inverted Mattes", () => {
    const mockLottie: LottieJSON = {
        fr: 30,
        ip: 0,
        op: 60,
        w: 100,
        h: 100,
        layers: [
            // Layer 0: The Mask (Index 0 in array, logically above Layer 1)
            {
                ind: 1,
                ty: 4,
                st: 0,
                op: 60,
                ks: {
                    a: { a: 0, k: [0, 0] },
                    p: { a: 0, k: [0, 0] },
                    s: { a: 0, k: [100, 100] },
                    r: { a: 0, k: 0 },
                    o: { a: 0, k: 100 }
                },
                shapes: [
                    { ty: "fl", c: { a: 0, k: [1, 1, 1] } },
                    { ty: "rc", s: { a: 0, k: [50, 50] }, p: { a: 0, k: [25, 25] }, r: { a: 0, k: 0 } }
                ]
            },
            // Layer 1: The Content (Index 1 in array)
            {
                ind: 2,
                ty: 4,
                st: 0,
                op: 60,
                tt: 2, // Track Matte Type 2 = Alpha Inverted
                ks: {
                    a: { a: 0, k: [0, 0] },
                    p: { a: 0, k: [0, 0] },
                    s: { a: 0, k: [100, 100] },
                    r: { a: 0, k: 0 },
                    o: { a: 0, k: 100 }
                },
                shapes: [
                    { ty: "fl", c: { a: 0, k: [1, 0, 0] } },
                    { ty: "rc", s: { a: 0, k: [100, 100] }, p: { a: 0, k: [50, 50] }, r: { a: 0, k: 0 } }
                ]
            }
        ]
    };

    test("converts Lottie tt:2 to engine maskMode: alphaInverted", () => {
        const scene = lottieToScene(mockLottie, 0);
        
        // lottieToScene processes layers in reverse (bottom-up visual order)
        // Layer 1 (Content) is processed, then Layer 0 (Mask) is attached to it.
        const contentNode = scene.children![0];
        
        expect(contentNode.mask).toBeDefined();
        expect(contentNode.style.maskMode).toBe("alphaInverted");
    });
});