import { getLottieValue } from "./interpolator.js";
import { bezierToPath, lottieColorToHex } from "./converter.js";
import { measurePath } from "../engine.js";
import type { SceneNode, StyleConfig } from "../types.js";
import type { LottieJSON, LottieTrimPath } from "./types.js";

export function lottieToScene(lottie: LottieJSON, frame: number): SceneNode {
    const layers = [...lottie.layers].reverse();
    const rootChildren: SceneNode[] = [];

    for (const layer of layers) {
        if (frame < layer.st || frame >= layer.op) continue;

        const ks = layer.ks;
        const pos = getLottieValue(ks.p, frame) || [0, 0];
        const scale = getLottieValue(ks.s, frame) || [100, 100];
        const rot = getLottieValue(ks.r, frame) || 0;
        const opacity = getLottieValue(ks.o, frame) || 100;
        const anchor = getLottieValue(ks.a, frame) || [0, 0];

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
            let currentStroke = null;
            let currentStrokeWidth = 0;
            
            // Scan for Trim Path
            const tm = layer.shapes.find((s: any) => s.ty === "tm") as LottieTrimPath | undefined;
            let trimStart = 0;
            let trimEnd = 100;
            
            if (tm) {
                trimStart = getLottieValue(tm.s, frame) ?? 0;
                trimEnd = getLottieValue(tm.e, frame) ?? 100;
            }

            for (const item of layer.shapes) {
                if (item.ty === "fl") {
                     currentFill = getLottieValue(item.c, frame);
                } else if (item.ty === "st") {
                     currentStroke = getLottieValue(item.c, frame);
                     currentStrokeWidth = getLottieValue(item.w, frame) ?? 0;
                } else if (item.ty === "rc") {
                     const size = getLottieValue(item.s, frame);
                     const p = getLottieValue(item.p, frame);
                     const r = getLottieValue(item.r, frame);
                     if (currentFill) {
                         children.push({
                             tag: "rect",
                             style: {
                                 position: "absolute",
                                 width: size[0], height: size[1],
                                 left: p[0] - size[0]/2 + anchor[0], 
                                 top: p[1] - size[1]/2 + anchor[1],
                                 borderRadius: r,
                                 backgroundColor: lottieColorToHex(currentFill)
                             }
                         });
                     }
                } else if (item.ty === "sh") {
                    const bezier = getLottieValue(item.ks, frame);
                    if (bezier) {
                        const d = bezierToPath(bezier);
                        const pathStyle: StyleConfig = {
                             position: "absolute",
                             left: anchor[0], top: anchor[1],
                        };

                        if (currentFill) {
                            pathStyle.backgroundColor = lottieColorToHex(currentFill);
                        }

                        if (currentStroke && currentStrokeWidth > 0) {
                            pathStyle.borderColor = lottieColorToHex(currentStroke);
                            pathStyle.borderWidth = currentStrokeWidth;
                            pathStyle.strokeLineCap = "round";
                            pathStyle.strokeLineJoin = "round";

                            if (tm) {
                                const len = measurePath(d);
                                if (len > 0) {
                                    const s = (trimStart / 100) * len;
                                    const e = (trimEnd / 100) * len;
                                    const visibleLen = Math.abs(e - s);
                                    
                                    pathStyle.strokeDashArray = [visibleLen, len];
                                    pathStyle.strokeDashOffset = -s;
                                }
                            }
                        }

                        if (currentFill || currentStroke) {
                            children.push({
                                tag: "path",
                                d,
                                style: pathStyle
                            });
                        }
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

