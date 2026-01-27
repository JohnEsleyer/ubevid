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
    const wasmPath = join(import.meta.dir, "../core/pkg/amethyst_core_bg.wasm");
    const wasmBuffer = await readFile(wasmPath);
    await init({ module_or_path: wasmBuffer });
    wasmInitialized = true;
  }

  if (!engineInstance) {
    engineInstance = AmethystEngine.new();
    
    const rawInfo = await engineInstance.get_hardware_info();
    hardwareInfo = JSON.parse(rawInfo);
    
    // Load Fonts
    if (config.fonts) {
      for (const [name, path] of Object.entries(config.fonts)) {
        try {
          const buffer = await readFile(path);
          engineInstance.load_font(name, new Uint8Array(buffer));
        } catch (e) {
          console.warn(`⚠️ Failed to load font '${name}':`, e);
        }
      }
    }

    // Load Image Assets
    if (config.assets) {
      for (const [name, path] of Object.entries(config.assets)) {
        try {
          const buffer = await readFile(path);
          engineInstance.load_asset(name, new Uint8Array(buffer));
        } catch (e) {
          console.warn(`⚠️ Failed to load asset '${name}':`, e);
        }
      }
    }
  }
  return engineInstance;
}

export function getRawEngine() {
  return engineInstance;
}

export function getHardwareReport(): HardwareReport {
  return hardwareInfo || { mode: "cpu", device: "Detecting..." };
}