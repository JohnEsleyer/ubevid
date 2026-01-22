export function interpolate(
  frame: number,
  inputRange: [number, number],
  outputRange: [number, number],
  easing: (t: number) => number = (t) => t
): number {
  const [startFrame, endFrame] = inputRange;
  const [startVal, endVal] = outputRange;

  let t = (frame - startFrame) / (endFrame - startFrame);
  t = Math.max(0, Math.min(1, t)); // Clamp 0-1

  const easedT = easing(t);
  return startVal + easedT * (endVal - startVal);
}

export const Easing = {
  linear: (t: number) => t,
  inOutQuad: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  outBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

// A simple seeded random generator (LCG)
let _seed = 12345;
export function setSeed(seed: number) { _seed = seed; }

export function random(): number {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
}

// Helper for range
export function randomRange(min: number, max: number) {
  return min + random() * (max - min);
}