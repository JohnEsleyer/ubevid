
import { getLottieValue } from "./interpolator.js";
import type { LottiePolystar } from "./types.js";

export function generatePolystarPath(shape: LottiePolystar, frame: number): string {
    const points = getLottieValue(shape.pt, frame) || 5;
    const position = getLottieValue(shape.p, frame) || [0, 0];
    const rotation = getLottieValue(shape.r, frame) || 0;
    const outerRadius = getLottieValue(shape.or, frame) || 100;
    const outerRoundness = getLottieValue(shape.os, frame) || 0;
    const type = getLottieValue(shape.sy, frame) || 1; // 1 = Star, 2 = Polygon

    const x = position[0];
    const y = position[1];
    
    let currentAngle = (rotation - 90) * (Math.PI / 180);
    const angleStep = (Math.PI * 2) / points;
    
    // Polygon (Type 2) logic is simpler
    if (type === 2) {
        let path = "";
        for (let i = 0; i < points; i++) {
            const px = x + Math.cos(currentAngle) * outerRadius;
            const py = y + Math.sin(currentAngle) * outerRadius;
            path += (i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
            currentAngle += angleStep;
        }
        return path + " Z";
    }

    // Star (Type 1)
    const innerRadius = getLottieValue(shape.ir, frame) || outerRadius / 2;
    // Inner roundness not fully implemented in this simplified version, using linear star
    const halfAngleStep = angleStep / 2;
    
    let path = "";
    for (let i = 0; i < points; i++) {
        // Outer Point
        let ox = x + Math.cos(currentAngle) * outerRadius;
        let oy = y + Math.sin(currentAngle) * outerRadius;
        path += (i === 0 ? `M ${ox} ${oy}` : ` L ${ox} ${oy}`);
        
        // Inner Point
        let ix = x + Math.cos(currentAngle + halfAngleStep) * innerRadius;
        let iy = y + Math.sin(currentAngle + halfAngleStep) * innerRadius;
        path += ` L ${ix} ${iy}`;

        currentAngle += angleStep;
    }
    
    return path + " Z";
}
