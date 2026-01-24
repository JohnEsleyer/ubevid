import { State } from "./state.js";
import { getEngine } from "./wasm.js";
import { VideoManager } from "./video.js";
import type { RenderConfig, SceneNode } from "./types.js";

const videoManager = new VideoManager();

async function renderRawFrame<T>(
  engine: any,
  sceneComponent: (props: T) => SceneNode,
  config: RenderConfig,
  frame: number,
  props: T
): Promise<Uint8Array> {
  State.frame = frame;
  State.offset = 0;

  if (config.videos) {
    for (const id of Object.keys(config.videos)) {
      const videoFrameBuffer = await videoManager.getFrame(id, frame);
      if (videoFrameBuffer) {
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
  
  // Audio side-loading
  if (config.audio && !State.audio) {
    const { AudioAnalyzer } = await import("./audio.js");
    const analyzer = new AudioAnalyzer();
    await analyzer.load(config.audio);
    State.audio = analyzer;
  }

  // Video side-loading
  if (config.videos) {
    for (const [id, path] of Object.entries(config.videos)) {
      await videoManager.load(id, path, config.fps);
    }
  }

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
    const subBuffer = await renderRawFrame(engine, sceneComponent, config, Math.round(t), props);
    for (let j = 0; j < subBuffer.length; j++) accumulation[j] += subBuffer[j];
  }

  const result = new Uint8Array(bufferSize);
  for (let i = 0; i < accumulation.length; i++) result[i] = accumulation[i] / samples;
  return result;
}