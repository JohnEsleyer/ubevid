import init, { UbeEngine } from "../core/pkg/ubevid_core.js";
import { readFile } from "fs/promises";
import { join } from "path";
import { spawn } from "bun";
import type { RenderConfig, SceneNode } from "./types.js";

export { startPreview } from "./server"; 

declare global {
  var _ubevid_frame: number;
  var _ubevid_offset: number;
}

globalThis._ubevid_frame = 0;
globalThis._ubevid_offset = 0;

let engineInstance: any = null;
let wasmInitialized = false;

async function getEngine(config: RenderConfig) {
  // 1. Initialize Wasm Module if not already done
  if (!wasmInitialized) {
    try {
      // Find the wasm file relative to this script
      const wasmPath = join(import.meta.dir, "../core/pkg/ubevid_core_bg.wasm");
      const wasmBuffer = await readFile(wasmPath);
      await init(wasmBuffer);
      wasmInitialized = true;
      console.log("✅ Wasm Module Initialized");
    } catch (e) {
      console.error("❌ Failed to initialize Wasm:", e);
      throw e;
    }
  }

  // 2. Create Engine Singleton
  if (!engineInstance) {
    engineInstance = UbeEngine.new();

    if (config.fonts) {
      for (const [name, path] of Object.entries(config.fonts)) {
        try {
          const buffer = await readFile(path);
          engineInstance.load_font(name, new Uint8Array(buffer));
          console.log(`   🔤 Font Registered: ${name}`);
        } catch (e) {
          console.error(`   ❌ Failed to load font ${name}:`, e);
        }
      }
    }

    if (config.assets) {
      for (const [id, path] of Object.entries(config.assets)) {
        try {
          const buffer = await readFile(path);
          engineInstance.load_asset(id, new Uint8Array(buffer));
          console.log(`   🖼️ Asset Registered: ${id}`);
        } catch (e) {
          console.error(`   ❌ Failed to load asset ${id}:`, e);
        }
      }
    }
  }
  return engineInstance;
}

export function useFrame(): number {
  return (globalThis._ubevid_frame || 0) - (globalThis._ubevid_offset || 0);
}

export function Sequence(props: { from: number; children: () => SceneNode }): SceneNode {
  const previousOffset = globalThis._ubevid_offset;
  globalThis._ubevid_offset += props.from;
  const result = props.children();
  globalThis._ubevid_offset = previousOffset;
  return result;
}

export async function renderSingleFrame<T>(
  sceneComponent: (props: T) => SceneNode,
  config: RenderConfig,
  frame: number,
  props: T
): Promise<Uint8Array> {
  const engine = await getEngine(config);
  globalThis._ubevid_frame = frame;
  globalThis._ubevid_offset = 0;
  const sceneGraph = sceneComponent(props);
  return engine.render(JSON.stringify(sceneGraph), Math.floor(config.width), Math.floor(config.height));
}

export async function render<T>(
  sceneComponent: (props: T) => SceneNode,
  config: RenderConfig,
  outputFile: string,
  props: T = {} as T
) {
  const { width, height, fps, duration } = config;
  const totalFrames = fps * duration;
  const engine = await getEngine(config);

  console.log(`🎬 Ubevid: Rendering ${totalFrames} frames...`);
  const ffmpegArgs = ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`, "-r", `${fps}`, "-i", "-"];
  if (config.audio) {
    ffmpegArgs.push("-i", config.audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-shortest");
  }
  ffmpegArgs.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", outputFile);

  const ffmpeg = spawn(["ffmpeg", ...ffmpegArgs], { stdin: "pipe", stdout: "ignore", stderr: "inherit" });
  const startTime = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    globalThis._ubevid_frame = i;
    globalThis._ubevid_offset = 0;
    const pixelBuffer = engine.render(JSON.stringify(sceneComponent(props)), width, height) as Uint8Array;
    ffmpeg.stdin.write(pixelBuffer);
    if (i % 10 === 0 || i === totalFrames - 1) {
      process.stdout.write(`\r🚀 Rendering: ${Math.round((i / totalFrames) * 100)}% `);
    }
  }

  ffmpeg.stdin.end();
  await ffmpeg.exited;
  console.log(`\n✅ Done! Saved to ${outputFile} in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
}