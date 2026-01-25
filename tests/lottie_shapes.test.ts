import { describe, expect, test } from "bun:test";
import { generatePolystarPath } from "../lib/lottie/shapes.js";
import type { LottiePolystar } from "../lib/lottie/types.js";

describe("Lottie Shape Generator", () => {
    test("generates polygon path", () => {
        const shape: LottiePolystar = {
            ty: "sr",
            sy: { a: 0, k: 2 }, // Polygon
            pt: { a: 0, k: 3 }, // Triangle
            p: { a: 0, k: [0, 0] },
            r: { a: 0, k: 0 },
            or: { a: 0, k: 100 },
            os: { a: 0, k: 0 }
        };

        const path = generatePolystarPath(shape, 0);
        // Triangle has 3 lines + Close
        const commands = path.split(' ');
        expect(commands[0]).toBe('M');
        expect(path).toContain('Z');
        // Simple check for move and lines
        expect(path.match(/L/g)?.length).toBe(2); 
    });

    test("generates star path", () => {
        const shape: LottiePolystar = {
            ty: "sr",
            sy: { a: 0, k: 1 }, // Star
            pt: { a: 0, k: 5 }, // Pentagon star
            p: { a: 0, k: [0, 0] },
            r: { a: 0, k: 0 },
            or: { a: 0, k: 100 },
            ir: { a: 0, k: 50 },
            os: { a: 0, k: 0 }
        };

        const path = generatePolystarPath(shape, 0);
        // Star with 5 points has 5 outer vertices and 5 inner vertices
        // Loop runs 5 times. Each time: M/L outer, L inner.
        // First: M outer, L inner.
        // Next 4: L outer, L inner.
        // Total Ls = 1 (first inner) + 4*2 (next ones) = 9 Ls.
        expect(path.match(/L/g)?.length).toBe(9);
        expect(path).toContain('Z');
    });
});