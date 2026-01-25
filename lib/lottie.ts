import { interpolate } from "./math.js";
import type { SceneNode, StyleConfig } from "./types.js";
export * from "./lottie/index.js";

// Simplified Lottie Types
interface LottieKeyframe {
    t: number; // Time (frames)
    s: any;    // Start Value
    e?: any;   // End Value
}

interface LottieProperty {
    a: 0 | 1; // Animated?
    k: any;   // Value or Keyframes
}

interface LottieTransform {
    p: LottieProperty; // Position
    s: LottieProperty; // Scale
    r: LottieProperty; // Rotation
    o: LottieProperty; // Opacity
    a: LottieProperty; // Anchor Point (IMPORTANT)
}

interface LottieLayer {
    ind: number;
    ty: number; // 4 = Shape
    ks: LottieTransform;
    st: number; // Start Frame
    op: number; // Out Frame
    shapes?: any[];
}

interface LottieJSON {
    fr: number; // Frame Rate
    ip: number; // In Point
    op: number; // Out Point
    w: number;
    h: number;
    layers: LottieLayer[];
}

function getValue(prop: LottieProperty, frame: number): any {
    if (!prop) return undefined;
    if (prop.a === 0) return prop.k;
    
    const keyframes = prop.k as LottieKeyframe[];
    if (frame <= keyframes[0].t) return keyframes[0].s;
    if (frame >= keyframes[keyframes.length - 1].t) {
        const last = keyframes[keyframes.length - 1];
        return last.e !== undefined ? last.e : last.s;
    }

    for (let i = 0; i < keyframes.length - 1; i++) {
        const kf = keyframes[i];
        const nextKf = keyframes[i+1];
        if (frame >= kf.t && frame < nextKf.t) {
            if (Array.isArray(kf.s) && Array.isArray(kf.e)) {
                return kf.s.map((v, idx) => interpolate(frame, [kf.t, nextKf.t], [v, (kf.e as any)[idx]]));
            } else if (typeof kf.s === "number" && typeof kf.e === "number") {
                return interpolate(frame, [kf.t, nextKf.t], [kf.s, kf.e]);
            }
        }
    }
    return keyframes[0].s;
}

export function lottieToScene(lottie: LottieJSON, frame: number): SceneNode {
    const layers = [...lottie.layers].reverse();
    const rootChildren: SceneNode[] = [];

    for (const layer of layers) {
        if (frame < layer.st || frame >= layer.op) continue;

        const ks = layer.ks;
        const pos = getValue(ks.p, frame) || [0, 0];
        const scale = getValue(ks.s, frame) || [100, 100];
        const rot = getValue(ks.r, frame) || 0;
        const opacity = getValue(ks.o, frame) || 100;
        const anchor = getValue(ks.a, frame) || [0, 0];

        // Lottie logic: 
        // 1. The 'left/top' is the position of the Anchor Point in the parent space.
        // 2. We must shift the content by negative Anchor Point values so it rotates correctly.
        const style: StyleConfig = {
            position: "absolute",
            left: pos[0] - anchor[0], 
            top: pos[1] - anchor[1],
            scale: scale[0] / 100,
            rotate: rot,
            opacity: opacity / 100,
        };
        
        const children: SceneNode[] = [];
        if (layer.ty === 4 && layer.shapes) {
            let currentFill = null;
            for (const item of layer.shapes) {
                if (item.ty === "fl") {
                     currentFill = getValue(item.c, frame);
                } else if (item.ty === "rc") {
                     const size = getValue(item.s, frame);
                     const p = getValue(item.p, frame);
                     const r = getValue(item.r, frame);
                     if (currentFill) {
                         const toHex = (n: number) => Math.floor(n * 255).toString(16).padStart(2, '0');
                         children.push({
                             tag: "rect",
                             style: {
                                 position: "absolute",
                                 width: size[0], height: size[1],
                                 left: p[0] - size[0]/2 + anchor[0], 
                                 top: p[1] - size[1]/2 + anchor[1],
                                 borderRadius: r,
                                 backgroundColor: `#${toHex(currentFill[0])}${toHex(currentFill[1])}${toHex(currentFill[2])}`
                             }
                         });
                     }
                }
            }
        }

        rootChildren.push({ tag: "view", style, children });
    }

    return {
        tag: "view",
        style: { width: lottie.w, height: lottie.h },
        children: rootChildren
    };
}

