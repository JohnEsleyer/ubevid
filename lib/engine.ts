import { spawn } from "bun";
import os from "node:os";
import pc from "picocolors";
import cliProgress from "cli-progress";
import { getRawEngine } from "./wasm.js";
import { renderSingleFrame } from "./renderer.js";
import type { RenderConfig, SceneNode } from "./types.js";

export * from "./hooks.js";
export { startPreview } from "./server.js";
export { renderSingleFrame };

export function measurePath(d: string): number {
  const engine = getRawEngine();
  return engine ? engine.measure_path(d) : 0;
}

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

  console.log(`\n${pc.magenta("🟣 UBEVID")} ${pc.dim("v0.1.0")}`);
  console.log(`${pc.cyan("🎬 Rendering:")} ${pc.white(outputFile)} ${pc.dim(`(${width}x${height} @ ${fps}fps)`)}`);

  const progressBar = new cliProgress.SingleBar({
    format: `${pc.magenta("{bar}")} ${pc.bold("{percentage}%")} | ${pc.dim("{value}/{total} frames")} | ETA: ${pc.cyan("{eta}s")}`,
    barCompleteChar: "█",
    barIncompleteChar: "░",
    hideCursor: true,
  });

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

  // Poll for completion to ensure all frames are written
  while (framesWritten < totalFrames) {
    await new Promise(r => setTimeout(r, 50));
  }

  // Slight pause to ensure progress bar draws its 100% state before stopping
  await new Promise(r => setTimeout(r, 100));
  progressBar.stop();
  ffmpeg.stdin.end();

  const exitCode = await ffmpeg.exited;
  
  if (exitCode === 0) {
    console.log(`${pc.green("✅ Success!")} Saved to ${pc.bold(outputFile)}\n`);
  } else {
    const errorOutput = await new Response(ffmpeg.stderr).text();
    console.error(`${pc.red("❌ FFmpeg Error (Code " + exitCode + "):")}\n${errorOutput}`);
  }
}