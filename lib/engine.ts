import { spawn } from "bun";
import os from "node:os";
import pc from "picocolors";
import { getEngine, getHardwareReport, getRawEngine } from "./wasm.js";
import { printAmethystHeader, createProgressBar } from "./cli.js";
import type { RenderConfig, SceneNode } from "./types.js";

// Re-exports for external use
export * from "./hooks.js";
export { startPreview } from "./server.js";
export { renderSingleFrame } from "./renderer.js";

/**
 * Main parallel render function
 */
export async function render<T>(
  sceneComponent: (props: T) => SceneNode,
  config: RenderConfig,
  outputFile: string,
  props: T = {} as T,
  sketchPath: string 
) {
  if (!sketchPath) {
    console.error(`\n${pc.red("❌ Error:")} You must provide the path to the sketch file for parallel rendering.`);
    process.exit(1);
  }

  const { width, height, fps, duration } = config;
  const totalFrames = fps * duration;
  
  // 1. Initialize Engine & Get Hardware Info
  await getEngine(config);
  const hardware = getHardwareReport();
  
  // 2. Print crystalline dashboard
  printAmethystHeader(hardware, sketchPath.split("/").pop() || "unknown", config);

  const progressBar = createProgressBar();
  const workerCount = Math.min(os.cpus().length || 4, 8); 

  const ffmpegArgs = ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`, "-r", `${fps}`, "-i", "-"];
  if (config.audio) ffmpegArgs.push("-i", config.audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-shortest");
  ffmpegArgs.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", outputFile);

  const ffmpeg = spawn(["ffmpeg", ...ffmpegArgs], { stdin: "pipe", stderr: "pipe" });
  
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
          ffmpeg.stdin.write(frameMap.get(framesWritten)!);
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

  await new Promise(r => setTimeout(r, 100));
  progressBar.stop();
  ffmpeg.stdin.end();

  const exitCode = await ffmpeg.exited;
  if (exitCode === 0) {
    console.log(`\n${pc.green("✅ Success!")} Saved to ${pc.bold(outputFile)}\n`);
  } else {
    const errorOutput = await new Response(ffmpeg.stderr).text();
    console.error(`\n${pc.red("❌ FFmpeg Error:")}\n${errorOutput}`);
  }
}

/**
 * Native utility to measure SVG path lengths
 */
export function measurePath(d: string): number {
  const engine = getRawEngine();
  return engine ? engine.measure_path(d) : 0;
}