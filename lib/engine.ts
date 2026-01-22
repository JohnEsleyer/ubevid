import { spawn } from "bun";
import { readFile } from "fs/promises";
// @ts-ignore - Built Wasm package
import { UbeEngine } from "../core/pkg/ubevid_core.js";
import type { RenderConfig, SceneNode } from "./types.js";

declare global {
  var _ubevid_frame: number;
}

export async function render(
  sceneComponent: () => SceneNode,
  config: RenderConfig,
  outputFile: string
) {
  const { width, height, fps, duration, assets } = config;
  const totalFrames = fps * duration;

  console.log(`🎬 Ubevid Engine: Initializing Rust Core...`);
  
  // 1. Initialize Wasm Engine
  const engine = UbeEngine.new();

  // 2. Load Assets
  if (assets) {
    for (const [id, path] of Object.entries(assets)) {
      console.log(`   📦 Loading asset: [${id}] -> ${path}`);
      try {
        const buffer = await readFile(path);
        // Pass Uint8Array to Rust
        engine.load_asset(id, new Uint8Array(buffer));
      } catch (e) {
        console.error(`   ❌ Failed to load asset ${id}:`, e);
      }
    }
  }

  console.log(`🎬 Rendering ${totalFrames} frames to ${outputFile}...`);

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

    const sceneGraph = sceneComponent(); 
    const jsonString = JSON.stringify(sceneGraph);
    
    // Call Class Method instead of static function
    const pixelBuffer = engine.render(jsonString, width, height) as Uint8Array;
    
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