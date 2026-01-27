import type { StyleConfig } from "../types.js";

/**
 * Professional Visual Presets for Content Creation.
 */
export const Effects = {
    /**
     * Cinematic Look: High contrast, slightly darker, boosted saturation.
     */
    cinematic: {
        brightness: 0.9,
        contrast: 1.2,
        saturation: 1.2
    },

    /**
     * Noir Look: Black and white with heavy contrast.
     */
    noir: {
        grayscale: 1,
        contrast: 1.5,
        brightness: 0.8
    },

    /**
     * Vintage Look: Sepia tone with lowered contrast.
     */
    vintage: {
        sepia: 0.8,
        contrast: 0.9,
        brightness: 1.1
    },

    /**
     * Cyberpunk Look: Inverted colors with high saturation (use carefully!).
     */
    cyberpunk: {
        invert: 0.1,
        contrast: 1.5,
        saturation: 2
    }
};

/**
 * Helper to blend between two effect objects.
 */
export function blendEffects(a: StyleConfig, b: StyleConfig, progress: number): StyleConfig {
    const res: any = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

    for (const key of keys) {
        const valA = (a as any)[key] ?? 0;
        const valB = (b as any)[key] ?? 0;
        if (typeof valA === "number" && typeof valB === "number") {
            res[key] = valA + (valB - valA) * progress;
        }
    }
    return res;
}
