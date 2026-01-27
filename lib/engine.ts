import pc from "picocolors";
import process from "node:process";

import { printAmethystHeader, createProgressBar } from "./cli.js";
import type { RenderConfig, SceneNode } from "./types.js";
import { VideoManager } from "./video.js";

const videoManager = new VideoManager();

export * from "./hooks.js";
export { Sequence } from "./sequence.js";
export { startPreview } from "./server.js";
export { renderSingleFrame } from "./renderer.js";
export * from "./components.js";
export * from "./math.js";
export * from "./stdlib/typography.js";
export * from "./stdlib/charts.js";
export * from "./stdlib/transitions.js";
export * from "./stdlib/effects.js"; // Export charts

import { spawn } from "bun";
import os from "node:os";

export async function render<T>(
  sceneComponent: (props: T) => SceneNode,
  config: RenderConfig,
  outputFile: string,
  props: T = {} as T,
  sketchPath: string
) {
  if (!sketchPath) {
    console.error(`\n${pc.red("❌ Error:")} Provide sketch file path for parallel rendering.`);
    process.exit(1);
  }

  const { width, height, fps, duration } = config;
  const totalFrames = fps * duration;

  // Pre-process videos
  if (config.videos) {
    for (const [id, path] of Object.entries(config.videos)) {
      await videoManager.load(id, path, fps, width, height);
    }
  }

  const hardware = { mode: "cpu" as const, device: "Skia Native (Software)" };

  printAmethystHeader(hardware, sketchPath.split("/").pop() || "unknown", config);

  const progressBar = createProgressBar();
  const workerCount = Math.min(os.cpus().length || 4, 8);

  const ffmpegArgs = ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`, "-r", `${fps}`, "-i", "-"];
  if (config.audio) ffmpegArgs.push("-i", config.audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-shortest");
  ffmpegArgs.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", outputFile);

  // Spawn FFmpeg
  const ffmpeg = spawn(["ffmpeg", ...ffmpegArgs], { stdin: "pipe", stderr: "pipe" });

  // Prevent stderr buffer from filling up and hanging the process
  const errorChunks: Uint8Array[] = [];
  async function readStderr() {
    // @ts-ignore
    for await (const chunk of ffmpeg.stderr) {
      errorChunks.push(chunk);
    }
  }
  const stderrPromise = readStderr();

  const frameMap = new Map<number, Uint8Array>();
  let framesWritten = 0;

  progressBar.start(totalFrames, 0);

  const chunkSize = Math.ceil(totalFrames / workerCount);
  const workers: Worker[] = [];

  for (let i = 0; i < workerCount; i++) {
    const startFrame = i * chunkSize;
    const endFrame = Math.min(startFrame + chunkSize - 1, totalFrames - 1);
    if (startFrame >= totalFrames) break;

    const worker = new Worker(new URL("./worker.js", import.meta.url).href);
    worker.postMessage({ startFrame, endFrame, config, props, componentPath: sketchPath });

    worker.onmessage = (event) => {
      const data = event.data;
      if (data.type === "frame") {
        frameMap.set(data.frame, new Uint8Array(data.pixels));
        while (frameMap.has(framesWritten)) {
          const pixels = frameMap.get(framesWritten)!;
          try {
            ffmpeg.stdin.write(pixels);
          } catch (e: any) {
            if (e.code !== "EPIPE") console.error("Write error:", e);
          }
          frameMap.delete(framesWritten);
          framesWritten++;
          progressBar.update(framesWritten);
        }
      }
      if (data.type === "done") worker.terminate();
      if (data.type === "error") {
        progressBar.stop();
        console.error(`\n${pc.red("❌ Worker Error:")} ${data.error}`);
        process.exit(1);
      }
    };
    workers.push(worker);
  }

  while (framesWritten < totalFrames) {
    await new Promise(r => setTimeout(r, 50));
  }

  // Allow a small buffer time for I/O flush
  await new Promise(r => setTimeout(r, 100));
  progressBar.stop();

  try {
    ffmpeg.stdin.end();
  } catch (e: any) {
    if (e.code !== "EPIPE") console.error("Pipe close error:", e);
  }

  const exitCode = await ffmpeg.exited;
  await stderrPromise; // Ensure we finished reading stderr

  if (exitCode === 0) {
    console.log(`\n${pc.green("✅ Success!")} Saved to ${pc.bold(outputFile)}\n`);
  } else {
    const decoder = new TextDecoder();
    const errorOutput = errorChunks.map(c => decoder.decode(c)).join("");
    console.error(`\n${pc.red("❌ FFmpeg Error:")}\n${errorOutput}`);
  }
}
