import { spawn } from "bun";
// @ts-ignore - Wasm package is built later
import { render_frame } from "../core/pkg/ubevid_core.js";
import type { RenderConfig, SceneNode } from "./types.js";

declare global {
  var _ubevid_frame: number;
}

export async function render(
  sceneComponent: () => SceneNode,
  config: RenderConfig,
  outputFile: string
) {
  const { width, height, fps, duration } = config;
  const totalFrames = fps * duration;

  console.log(`🎬 Ubevid Engine: Rendering ${totalFrames} frames...`);

  const ffmpeg = spawn([
    "ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgba",
    "-s", `${width}x${height}`, "-r", `${fps}`,
    "-i", "-", "-c:v", "libx264", "-preset", "ultrafast",
    "-pix_fmt", "yuv420p", outputFile
  ], {
    stdin: "pipe",
    stdout: "ignore",
    stderr: "inherit",
  });

  const startTime = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    globalThis._ubevid_frame = i;

    // TypeScript enforces the return type of the scene function
    const sceneGraph = sceneComponent(); 
    const jsonString = JSON.stringify(sceneGraph);
    
    // Call Rust
    const pixelBuffer = render_frame(jsonString, width, height) as Uint8Array;
    ffmpeg.stdin.write(pixelBuffer);

    if (i % 10 === 0) process.stdout.write(`.`);
  }

  ffmpeg.stdin.end();
  await ffmpeg.exited;

  const time = (Date.now() - startTime) / 1000;
  console.log(`\n✅ Done! Saved to ${outputFile} in ${time.toFixed(2)}s`);
}

export function useFrame(): number {
  return globalThis._ubevid_frame || 0;
}