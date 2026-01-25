import { describe, expect, test, beforeEach } from "bun:test";
import { useKeyframes, useFrame } from "../lib/hooks.js";
import { State } from "../lib/state.js";

describe("Animation Hooks", () => {
  beforeEach(() => {
    State.frame = 0;
    State.offset = 0;
  });

  test("useFrame returns correct frame with offset", () => {
    State.frame = 50;
    State.offset = 20;
    expect(useFrame()).toBe(30);
  });

  test("useKeyframes interpolates correctly", () => {
    const kf = {
      0: 0,
      10: 100,
      20: 0
    };

    // Frame 0
    State.frame = 0;
    expect(useKeyframes(kf)).toBe(0);

    // Frame 5 (midpoint)
    State.frame = 5;
    expect(useKeyframes(kf)).toBe(50);

    // Frame 10 (peak)
    State.frame = 10;
    expect(useKeyframes(kf)).toBe(100);

    // Frame 15 (midpoint down)
    State.frame = 15;
    expect(useKeyframes(kf)).toBe(50);

    // Frame 25 (clamped)
    State.frame = 25;
    expect(useKeyframes(kf)).toBe(0);
  });

  test("useKeyframes handles unsorted keys", () => {
    const kf = {
      20: 0,
      0: 0,
      10: 100
    };
    State.frame = 5;
    expect(useKeyframes(kf)).toBe(50);
  });
});