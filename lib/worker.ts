import { renderSingleFrame } from "./renderer.js";
import type { RenderConfig } from "./types.js";

declare var self: Worker;

/**
 * Worker thread for rendering a chunk of frames.
 */
self.onmessage = async (event: MessageEvent) => {
  const { startFrame, endFrame, config, props, componentPath } = event.data;

  try {
    // Dynamically import the user's sketch component
    const module = await import(componentPath);
    // Support default or named exports
    const sceneComponent = module.default || module[Object.keys(module)[0]];

    for (let i = startFrame; i <= endFrame; i++) {
      const pixels = await renderSingleFrame(sceneComponent, config, i, props);
      
      // Transfer the buffer back to the main thread (zero-copy)
      // Casting pixels.buffer to any solves the ArrayBuffer/Transferable type collision in Bun/TS
      const buffer = pixels.buffer;
      self.postMessage({
        type: "frame",
        frame: i,
        pixels: buffer
      }, [buffer as any]); 
    }

    self.postMessage({ type: "done" });
  } catch (e: any) {
    self.postMessage({ type: "error", error: e.message });
  }
};
