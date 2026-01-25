import { describe, expect, test } from "bun:test";
import { spawn } from "bun";

describe("Bun Spawn API Check", () => {
  test("proc.exited returns a number", async () => {
    // Run a simple command that exits with code 0
    const proc = spawn(["true"]);
    const result = await proc.exited;
    
    expect(typeof result).toBe("number");
    expect(result).toBe(0);
  });
});
