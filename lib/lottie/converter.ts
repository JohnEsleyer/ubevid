import type { LottieBezier } from "./types.js";

/**
 * Converts Lottie Bezier data to an SVG path string.
 */
export function bezierToPath(bezier: LottieBezier): string {
    const { v, i, o, c } = bezier;
    if (!v || v.length === 0) return "";

    let path = `M ${v[0][0]},${v[0][1]}`;

    for (let j = 1; j < v.length; j++) {
        // Safe access to tangents defaulting to 0,0 if missing or mismatched length
        const tangentOut = (o && o[j - 1]) ? o[j - 1] : [0, 0];
        const tangentIn = (i && i[j]) ? i[j] : [0, 0];

        const cp1x = v[j - 1][0] + tangentOut[0];
        const cp1y = v[j - 1][1] + tangentOut[1];
        const cp2x = v[j][0] + tangentIn[0];
        const cp2y = v[j][1] + tangentIn[1];
        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${v[j][0]},${v[j][1]}`;
    }

    if (c) {
        const j = 0;
        const last = v.length - 1;
        
        const tangentOut = (o && o[last]) ? o[last] : [0, 0];
        const tangentIn = (i && i[j]) ? i[j] : [0, 0];

        const cp1x = v[last][0] + tangentOut[0];
        const cp1y = v[last][1] + tangentOut[1];
        const cp2x = v[j][0] + tangentIn[0];
        const cp2y = v[j][1] + tangentIn[1];
        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${v[j][0]},${v[j][1]} Z`;
    }

    return path;
}

export function lottieColorToHex(c: [number, number, number, number?]): string {
    const toHex = (n: number) => Math.floor(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(c[0])}${toHex(c[1])}${toHex(c[2])}`;
}
