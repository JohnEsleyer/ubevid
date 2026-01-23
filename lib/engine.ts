import init, { UbeEngine } from "../core/pkg/ubevid_core.js";
import { readFile } from "fs/promises";
import { join } from "path";
import { spawn } from "bun";
import { AudioAnalyzer } from "./audio.js";
import type { RenderConfig, SceneNode } from "./types.js";

export { startPreview } from "./server.js"; 

declare global {
  var _ubevid_frame: number;
  var _ubevid_offset: number;
  var _ubevid_audio: AudioAnalyzer | null;
}

globalThis._ubevid_frame = 0;
globalThis._ubevid_offset = 0;
globalThis._ubevid_audio = null;

let engineInstance: any = null;
let wasmInitialized = false;

const audioAnalyzer = new AudioAnalyzer();

async function getEngine(config: RenderConfig) {
  if (config.audio && !globalThis._ubevid_audio) {
    await audioAnalyzer.load(config.audio);
    globalThis._ubevid_audio = audioAnalyzer;
  }

  if (!wasmInitialized) {
    try {
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

export function useAudio(fps: number = 30): number {
  if (!globalThis._ubevid_audio) return 0;
  return globalThis._ubevid_audio.getVolume(globalThis._ubevid_frame, fps);
}

export function Sequence(props: { from: number; children: () => SceneNode }): SceneNode {
  const previousOffset = globalThis._ubevid_offset;
  globalThis._ubevid_offset += props.from;
  const result = props.children();
  globalThis._ubevid_offset = previousOffset;
  return result;
}

function accumulateBuffer(acc: Float32Array, buffer: Uint8Array) {
    for (let i = 0; i < buffer.length; i++) {
        acc[i] += buffer[i];
    }
}

function averageBuffer(acc: Float32Array, count: number): Uint8Array {
    const result = new Uint8Array(acc.length);
    for (let i = 0; i < acc.length; i++) {
        result[i] = acc[i] / count;
    }
    return result;
}

// Internal renderer that doesn't handle accumulation, just raw frame output
async function renderRawFrame<T>(
    engine: any,
    sceneComponent: (props: T) => SceneNode,
    config: RenderConfig,
    frame: number,
    props: T
): Promise<Uint8Array> {
    globalThis._ubevid_frame = frame;
    globalThis._ubevid_offset = 0;
    const sceneGraph = sceneComponent(props);
    return engine.render(JSON.stringify(sceneGraph), Math.floor(config.width), Math.floor(config.height));
}

export async function renderSingleFrame<T>(
  sceneComponent: (props: T) => SceneNode,
  config: RenderConfig,
  frame: number,
  props: T
): Promise<Uint8Array> {
  const engine = await getEngine(config);
  const samples = config.motionBlurSamples || 0;

  if (samples <= 1) {
      return renderRawFrame(engine, sceneComponent, config, frame, props);
  }

  // Motion Blur Logic
  const shutterAngle = config.shutterAngle || 180;
  const exposureDuration = shutterAngle / 360; // e.g. 0.5 frames
  const timeStep = exposureDuration / samples;
  
  // Accumulator (Float32 to prevent overflow during summing)
  // We allocate this once per frame call, effectively.
  const bufferSize = Math.floor(config.width) * Math.floor(config.height) * 4;
  const accumulation = new Float32Array(bufferSize);

  // Center the blur window around the frame, or start at frame? 
  // Standard is usually starting at frame for "forward" accumulation or centered.
  // Let's do simple forward accumulation starting at 'frame'.
  for (let i = 0; i < samples; i++) {
      const t = frame + (i * timeStep);
      const subBuffer = await renderRawFrame(engine, sceneComponent, config, t, props);
      accumulateBuffer(accumulation, subBuffer);
  }

  return averageBuffer(accumulation, samples);
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
  if (config.motionBlurSamples) {
      console.log(`   💨 Motion Blur Enabled: ${config.motionBlurSamples} samples, ${config.shutterAngle || 180}° shutter`);
  }

  const ffmpegArgs = ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`, "-r", `${fps}`, "-i", "-"];
  if (config.audio) {
    ffmpegArgs.push("-i", config.audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-shortest");
  }
  ffmpegArgs.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", outputFile);

  const ffmpeg = spawn(["ffmpeg", ...ffmpegArgs], { stdin: "pipe", stdout: "ignore", stderr: "inherit" });
  const startTime = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    // Reuse renderSingleFrame logic to handle MB
    const pixelBuffer = await renderSingleFrame(sceneComponent, config, i, props);
    ffmpeg.stdin.write(pixelBuffer);
    
    if (i % 10 === 0 || i === totalFrames - 1) {
      process.stdout.write(`\r🚀 Rendering: ${Math.round((i / totalFrames) * 100)}% `);
    }
  }

  ffmpeg.stdin.end();
  await ffmpeg.exited;
  console.log(`\n✅ Done! Saved to ${outputFile} in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
}