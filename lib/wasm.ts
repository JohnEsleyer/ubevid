import init, { AmethystEngine } from "../core/pkg/amethyst_core.js";
import { readFile } from "fs/promises";
import { join } from "path";
import type { RenderConfig } from "./types.js";

let engineInstance: any = null;
let wasmInitialized = false;

/**
 * Initializes the Wasm core and loads assets.
 * Updated to use the non-deprecated single-object initialization.
 */
export async function getEngine(config: RenderConfig) {
  if (!wasmInitialized) {
    try {
      const wasmPath = join(import.meta.dir, "../core/pkg/amethyst_core_bg.wasm");
      const wasmBuffer = await readFile(wasmPath);
      
      // Fix: Use the single-object parameter to avoid deprecation warnings
      // which mangle the terminal progress bar.
      await init({ module_or_path: wasmBuffer });
      
      wasmInitialized = true;
    } catch (e) {
      console.error("❌ Failed to initialize Wasm:", e);
      throw e;
    }
  }

  if (!engineInstance) {
    engineInstance = AmethystEngine.new();
    
    // Load Fonts
    if (config.fonts) {
      for (const [name, path] of Object.entries(config.fonts)) {
        const buffer = await readFile(path);
        engineInstance.load_font(name, new Uint8Array(buffer));
      }
    }
    
    // Load Static Assets
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
