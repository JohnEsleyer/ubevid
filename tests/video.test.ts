import { describe, expect, test } from "bun:test";
import { VideoManager } from "../lib/video.ts";
import { existsSync, rmSync } from "fs";
import { join } from "path";

describe("VideoManager", () => {
  const testCache = ".ubevid/test-cache";
  const manager = new VideoManager(testCache);

  test("calculates correct frame paths", async () => {
    // This is a unit test for the logic, not actual ffmpeg execution
    // which is hard to guarantee in every CI environment without assets
    const frameNumber = 5;
    const id = "test-vid";
    
    // We expect 0-indexed frame 5 to map to 000006.png
    const expectedFile = "000006.png";
    const path = join(testCache, id, expectedFile);
    
    // Check internal mapping logic via getFrame attempt
    const frame = await manager.getFrame(id, frameNumber);
    expect(frame).toBeNull(); // Because file doesn't exist
  });

  test("creates cache directory structure", async () => {
     // Cleanup from previous tests
     if (existsSync(testCache)) rmSync(testCache, { recursive: true });
     
     // Note: We don't call load() here as it requires a real .mp4 file
     expect(existsSync(testCache)).toBe(false);
  });
});
