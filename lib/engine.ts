
import init, { UbeEngine } from "../core/pkg/ubevid_core.js";
import { readFile } from "fs/promises";
import { join } from "path";
import { spawn } from "bun";
import { AudioAnalyzer } from "./audio.js";
import { VideoManager } from "./video.js";
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
const videoManager = new VideoManager();

async function getEngine(config: RenderConfig) {
  if (config.audio && !globalThis._ubevid_audio) {
    await audioAnalyzer.load(config.audio);
    globalThis._ubevid_audio = audioAnalyzer;
  }
  
  // Pre-process videos
  if (config.videos) {
    for (const [id, path] of Object.entries(config.videos)) {
      await videoManager.load(id, path, config.fps);
    }
  }

  if (!wasmInitialized) {
    try {
      const wasmPath = join(import.meta.dir, "../core/pkg/ubevid_core_bg.wasm");
      const wasmBuffer = await readFile(wasmPath);
      await init(wasmBuffer);
      wasmInitialized = true;
    } catch (e) {
      console.error("❌ Failed to initialize Wasm:", e);
      throw e;
    }
  }

  if (!engineInstance) {
    engineInstance = UbeEngine.new();
    if (config.fonts) {
      for (const [name, path] of Object.entries(config.fonts)) {
        const buffer = await readFile(path);
        engineInstance.load_font(name, new Uint8Array(buffer));
      }
    }
    if (config.assets) {
      for (const [id, path] of Object.entries(config.assets)) {
        const buffer = await readFile(path);
        engineInstance.load_asset(id, new Uint8Array(buffer));
      }
    }
  }
  return engineInstance;
}

export function measurePath(d: string): number {
    if (!engineInstance) return 0;
    return engineInstance.measure_path(d);
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

async function renderRawFrame<T>(
    engine: any,
    sceneComponent: (props: T) => SceneNode,
    config: RenderConfig,
    frame: number,
    props: T
): Promise<Uint8Array> {
    globalThis._ubevid_frame = frame;
    globalThis._ubevid_offset = 0;

    // Update Video Textures for this frame
    if (config.videos) {
        for (const id of Object.keys(config.videos)) {
            const videoFrameBuffer = await videoManager.getFrame(id, frame);
            if (videoFrameBuffer) {
                // Update the asset in Rust memory
                // We use load_asset (PNG decoder) because our cache stores PNGs.
                // This is reasonably fast for 1080p on local SSD.
                engine.load_asset(id, videoFrameBuffer);
            }
        }
    }

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

  const shutterAngle = config.shutterAngle || 180;
  const exposureDuration = shutterAngle / 360;
  const timeStep = exposureDuration / samples;
  
  const bufferSize = Math.floor(config.width) * Math.floor(config.height) * 4;
  const accumulation = new Float32Array(bufferSize);

  for (let i = 0; i < samples; i++) {
      const t = frame + (i * timeStep);
      // NOTE: For video textures, we currently snap to the nearest integer frame 
      // because our cache is integer-based. For true motion blur on video, 
      // we'd need optical flow or higher FPS cache. 
      // For now, it will just use the same video frame for sub-samples or snap.
      const subBuffer = await renderRawFrame(engine, sceneComponent, config, Math.round(t), props);
      for (let j = 0; j < subBuffer.length; j++) { accumulation[j] += subBuffer[j]; }
  }

  const result = new Uint8Array(bufferSize);
  for (let i = 0; i < accumulation.length; i++) { result[i] = accumulation[i] / samples; }
  return result;
}

export async function render<T>(
  sceneComponent: (props: T) => SceneNode,
  config: RenderConfig,
  outputFile: string,
  props: T = {} as T
) {
  const { width, height, fps, duration } = config;
  const totalFrames = fps * duration;
  const engine = await getEngine(config); // Initializes assets & videos

  const ffmpegArgs = ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`, "-r", `${fps}`, "-i", "-"];
  if (config.audio) {
    ffmpegArgs.push("-i", config.audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-shortest");
  }
  ffmpegArgs.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", outputFile);

  const ffmpeg = spawn(["ffmpeg", ...ffmpegArgs], { stdin: "pipe", stdout: "ignore", stderr: "inherit" });
  for (let i = 0; i < totalFrames; i++) {
    const pixelBuffer = await renderSingleFrame(sceneComponent, config, i, props);
    ffmpeg.stdin.write(pixelBuffer);
    if (i % 10 === 0) process.stdout.write(`\r🚀 Rendering: ${Math.round((i / totalFrames) * 100)}% `);
  }

  ffmpeg.stdin.end();
  await ffmpeg.exited;
  console.log(`\n✅ Saved to ${outputFile}`);
}
