import { spawn } from "bun";
import { State } from "./state.js";
import { getRawEngine } from "./wasm.js";
import { renderSingleFrame } from "./renderer.js";
import type { RenderConfig, SceneNode } from "./types.js";

// Re-export hooks
export * from "./hooks.js";
export { startPreview } from "./server.js";

export function measurePath(d: string): number {
  const engine = getRawEngine();
  return engine ? engine.measure_path(d) : 0;
}

export function Sequence(props: { from: number; children: () => SceneNode }): SceneNode {
  const previousOffset = State.offset;
  State.offset += props.from;
  const result = props.children();
  State.offset = previousOffset;
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

export { renderSingleFrame };
