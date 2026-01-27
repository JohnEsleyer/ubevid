import init, { AmethystEngine } from "../core/pkg/amethyst_core.js";
import { readFile } from "fs/promises";
import { join } from "path";
import type { RenderConfig } from "./types.js";
import type { HardwareReport } from "./cli.ts";

let engineInstance: any = null;
let wasmInitialized = false;
let hardwareInfo: HardwareReport | null = null;

export async function getEngine(config: RenderConfig) {
  if (!wasmInitialized) {
    try {
      const wasmPath = join(import.meta.dir, "../core/pkg/amethyst_core_bg.wasm");
      const wasmBuffer = await readFile(wasmPath);
      await init({ module_or_path: wasmBuffer });
      wasmInitialized = true;
    } catch (e) {
      console.error("❌ Failed to initialize Wasm:", e);
      throw e;
    }
  }

  if (!engineInstance) {
    engineInstance = AmethystEngine.new();
    hardwareInfo = JSON.parse(engineInstance.get_hardware_info());
    
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

export function getHardwareReport(): HardwareReport {
  return hardwareInfo || { mode: "cpu", device: "Unknown" };
}

export function getRawEngine() {
  return engineInstance;
}