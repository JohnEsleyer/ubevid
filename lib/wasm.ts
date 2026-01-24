import init, { UbeEngine } from "../core/pkg/ubevid_core.js";
import { readFile } from "fs/promises";
import { join } from "path";
import type { RenderConfig } from "./types.js";

let engineInstance: any = null;
let wasmInitialized = false;

export async function getEngine(config: RenderConfig) {
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

export function getRawEngine() {
  return engineInstance;
}
