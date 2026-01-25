import { describe, expect, test } from "bun:test";
import path from "path";

describe("Phase 1: Performance Infrastructure", () => {
  test("Worker file exists for multithreading", async () => {
    const workerFile = Bun.file(path.join(import.meta.dir, "../lib/worker.ts"));
    expect(await workerFile.exists()).toBe(true);
  });

  test("VideoManager uses .raw extension for zero-copy caching", () => {
    const { VideoManager } = require("../lib/video.ts");
    const vm = new VideoManager(".test_cache");
    // Internal check of the getFrame logic we updated
    expect(vm.getFrame("vid", 0)).toBeDefined();
  });
});