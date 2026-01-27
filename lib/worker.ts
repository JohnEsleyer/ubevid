import { renderSingleFrame } from "./renderer.js";

self.onmessage = async (event) => {
  const { startFrame, endFrame, config, componentPath } = event.data;
  const module = await import(componentPath);
  const sceneComponent = module.default;

  for (let i = startFrame; i <= endFrame; i++) {
    // Skia-Canvas renders natively on this thread
    const buffer = await renderSingleFrame(sceneComponent, config, i);

    self.postMessage({
      type: "frame",
      frame: i,
      pixels: buffer.buffer
    }, [buffer.buffer as any]);
  }
  self.postMessage({ type: "done" });
};
