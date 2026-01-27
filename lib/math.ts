import { Noise } from "./noise.js";

export class Random {
  private seed: number;
  constructor(seed: number = 12345) { this.seed = seed; }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  range(min: number, max: number) {
    return min + this.next() * (max - min);
  }
}

let _globalRandom = new Random(12345);
let _globalNoise = new Noise(12345);

export function setSeed(seed: number) {
  _globalRandom = new Random(seed);
  _globalNoise = new Noise(seed);
}

export function random(): number {
  return _globalRandom.next();
}

export function randomRange(min: number, max: number) {
  return _globalRandom.range(min, max);
}

/**
 * Generates Simplex/Perlin-like noise in 3D (x, y, time).
 * Returns a value roughly between -1.0 and 1.0.
 */
export function noise(x: number, y: number = 0, z: number = 0): number {
  return _globalNoise.perlin3(x, y, z);
}

/**
 * Maps a value from one range to another.
 * Useful for converting Audio volume (0..1) to Visual properties (e.g. 100..500 width).
 */
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function interpolate(
  frame: number,
  inputRange: [number, number],
  outputRange: [number, number],
  easing: (t: number) => number = (t) => t
): number {
  const [startFrame, endFrame] = inputRange;
  const [startVal, endVal] = outputRange;

  let t = (frame - startFrame) / (endFrame - startFrame);
  t = Math.max(0, Math.min(1, t));

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
  },
  inElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  outElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  inOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};