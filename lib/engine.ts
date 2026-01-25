import { spawn } from "bun";
import os from "node:os";
import { getRawEngine } from "./wasm.js";
import { renderSingleFrame } from "./renderer.js";
import type { RenderConfig, SceneNode } from "./types.js";

// Re-export hooks and the single frame renderer
export * from "./hooks.js";
export { startPreview } from "./server.js";
export { renderSingleFrame }; // Fixed: Now explicitly exported for tests

/**
 * Calculates the length of an SVG path string.
 */
export function measurePath(d: string): number {
  const engine = getRawEngine();
  return engine ? engine.measure_path(d) : 0;
}

/**
 * Parallel Render: Distributes frames across Bun Workers.
 */
export async function render<T>(
  sceneComponent: (props: T) => SceneNode,
  config: RenderConfig,
  outputFile: string,
  props: T = {} as T,
  sketchPath: string 
) {
  const { width, height, fps, duration } = config;
  const totalFrames = fps * duration;
  
  const cpuCount = os.cpus().length || 4;
  const workerCount = Math.min(cpuCount, 8); 

  console.log(`🚀 Starting Parallel Render (${workerCount} workers)`);

  const ffmpegArgs = ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`, "-r", `${fps}`, "-i", "-"];
  if (config.audio) ffmpegArgs.push("-i", config.audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-shortest");
  ffmpegArgs.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", outputFile);

  const ffmpeg = spawn(["ffmpeg", ...ffmpegArgs], { stdin: "pipe" });
  
  const frameMap = new Map<number, Uint8Array>();
  let framesWritten = 0;

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
          if (framesWritten % 10 === 0) {
             process.stdout.write(`\r📦 Progress: ${Math.round((framesWritten / totalFrames) * 100)}%`);
          }
        }
      }
      if (data.type === "done") worker.terminate();
    };
    workers.push(worker);
  }

  while (framesWritten < totalFrames) {
    await new Promise(r => setTimeout(r, 100));
  }

  ffmpeg.stdin.end();
  await ffmpeg.exited;
  console.log(`\n✅ Render Complete: ${outputFile}`);
}