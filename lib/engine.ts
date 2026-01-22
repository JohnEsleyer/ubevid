import { spawn } from "bun";
import { readFile } from "fs/promises";
// @ts-ignore - Built Wasm package
import { UbeEngine } from "../core/pkg/ubevid_core.js";
import type { RenderConfig, SceneNode } from "./types.js";

declare global {
  var _ubevid_frame: number;
}

let engineInstance: any = null;

async function getEngine(config: RenderConfig) {
  if (!engineInstance) {
    engineInstance = UbeEngine.new();
    if (config.assets) {
      for (const [id, path] of Object.entries(config.assets)) {
        console.log(`   📦 Loading asset: [${id}] -> ${path}`);
        const buffer = await readFile(path);
        engineInstance.load_asset(id, new Uint8Array(buffer));
      }
    }
  }
  return engineInstance;
}

export async function renderSingleFrame(
  sceneComponent: () => SceneNode,
  config: RenderConfig,
  frame: number
): Promise<Uint8Array> {
  const engine = await getEngine(config);
  globalThis._ubevid_frame = frame;
  const sceneGraph = sceneComponent();
  
  const w = Math.floor(config.width);
  const h = Math.floor(config.height);
  
  const result = engine.render(JSON.stringify(sceneGraph), w, h);
  
  if (!result) throw new Error("Rust engine returned null pixels");
  return result;
}

export async function render(
  sceneComponent: () => SceneNode,
  config: RenderConfig,
  outputFile: string
) {
  const { width, height, fps, duration } = config;
  const totalFrames = fps * duration;
  
  // Initialize engine and load assets
  const engine = await getEngine(config);

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
    const pixelBuffer = engine.render(JSON.stringify(sceneGraph), width, height) as Uint8Array;
    
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