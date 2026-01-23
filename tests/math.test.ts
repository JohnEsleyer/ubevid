import { describe, expect, test } from "bun:test";
import { interpolate, mapRange, Random, Easing } from "../lib/math.js";

describe("Math Utilities", () => {
  test("mapRange maps values correctly", () => {
    expect(mapRange(0.5, 0, 1, 0, 100)).toBe(50);
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
    expect(mapRange(2, 1, 3, 10, 30)).toBe(20);
  });

  test("interpolate handles linear clamping", () => {
    // Before start frame
    expect(interpolate(0, [10, 20], [0, 100])).toBe(0);
    // After end frame
    expect(interpolate(30, [10, 20], [0, 100])).toBe(100);
    // Midpoint
    expect(interpolate(15, [10, 20], [0, 100])).toBe(50);
  });

  test("interpolate handles easing functions", () => {
    // Quad easing at 50% is 2*t*t = 2*0.5*0.5 = 0.5 (Linear equivalent in this specific math? No)
    // inOutQuad: t < 0.5 ? 2*t*t 
    // t=0.25 (frame 12.5 in 10-20 range) -> 2 * 0.25^2 = 0.125
    // Linear would be 0.25. So it should be smaller.
    const val = interpolate(12.5, [10, 20], [0, 100], Easing.inOutQuad);
    expect(val).toBeCloseTo(12.5); 
  });

  test("Random is deterministic with seeds", () => {
    const r1 = new Random(123);
    const v1 = r1.next();
    const v2 = r1.next();

    const r2 = new Random(123);
    expect(r2.next()).toBe(v1);
    expect(r2.next()).toBe(v2);

    const r3 = new Random(456);
    expect(r3.next()).not.toBe(v1);
  });
});