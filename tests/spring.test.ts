
import { describe, expect, test } from "bun:test";
import { Spring } from "../lib/spring.js";

describe("Physics Engine", () => {
  test("Spring initializes correctly", () => {
    const spring = new Spring(100);
    expect(spring.get()).toBe(100);
  });

  test("Spring moves towards target", () => {
    const spring = new Spring(0, { tension: 100, friction: 10 });
    spring.set(100);
    
    // Simulate 1 second
    for (let i = 0; i < 30; i++) {
        spring.update(1/30);
    }
    
    // Should be close to 100
    expect(spring.get()).toBeGreaterThan(50);
    expect(spring.get()).toBeLessThan(110);
  });
});