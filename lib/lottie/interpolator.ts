import { interpolate } from "../math.js";
import type { LottieProperty, LottieKeyframe } from "./types.js";

export function getLottieValue(prop: LottieProperty | undefined, frame: number): any {
    if (!prop) return undefined;
    if (prop.a !== 1) return prop.k;
    
    const keyframes = prop.k as LottieKeyframe[];

    if (!Array.isArray(keyframes) || keyframes.length === 0) return undefined;

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
                // Fixed implicit any types for v and idx
                return kf.s.map((v: number, idx: number) => 
                    interpolate(frame, [kf.t, nextKf.t], [v, (kf.e as any)[idx]])
                );
            } else if (typeof kf.s === "number" && typeof kf.e === "number") {
                return interpolate(frame, [kf.t, nextKf.t], [kf.s, kf.e]);
            }
        }
    }
    return keyframes[0].s;
}

