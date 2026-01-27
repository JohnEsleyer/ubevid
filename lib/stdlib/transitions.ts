import { View } from "../components.js";
import type { SceneNode } from "../types.js";

/**
 * Basic Transitions for content creation.
 */
export const Transitions = {
    /**
     * Simple CrossFade between two nodes.
     */
    crossFade: (a: SceneNode, b: SceneNode, progress: number): SceneNode => {
        return View({ width: "100%", height: "100%", position: "relative" }, [
            {
                ...a,
                style: {
                    ...a.style,
                    opacity: (a.style.opacity ?? 1) * (1 - progress),
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%"
                }
            },
            {
                ...b,
                style: {
                    ...b.style,
                    opacity: (b.style.opacity ?? 1) * progress,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%"
                }
            }
        ]);
    },

    /**
     * Slide transition (Left to Right by default).
     */
    slide: (a: SceneNode, b: SceneNode, progress: number, direction: "left" | "right" | "top" | "bottom" = "left"): SceneNode => {
        const offset = progress * 100;
        let aStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" } as any;
        let bStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" } as any;

        if (direction === "left") {
            aStyle.left = `-${offset}%`;
            bStyle.left = `${100 - offset}%`;
        } else if (direction === "right") {
            aStyle.left = `${offset}%`;
            bStyle.left = `-${100 - offset}%`;
        } else if (direction === "top") {
            aStyle.top = `-${offset}%`;
            bStyle.top = `${100 - offset}%`;
        } else if (direction === "bottom") {
            aStyle.top = `${offset}%`;
            bStyle.top = `-${100 - offset}%`;
        }

        return View({ width: "100%", height: "100%", position: "relative", overflow: "hidden" }, [
            { ...a, style: { ...a.style, ...aStyle } },
            { ...b, style: { ...b.style, ...bStyle } }
        ]);
    }
};
