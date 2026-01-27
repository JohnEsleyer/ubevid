import { render } from "../lib/engine.js";
import MaskingDemo from "./masking_vfx_demo.js";
import { join } from "node:path";

const config = {
    width: 1280,
    height: 720,
    fps: 30,
    duration: 3,
    fonts: {
        "Roboto": join(process.cwd(), "assets/Roboto-Bold.ttf")
    }
};

console.log("🚀 Starting Masking & VFX Render...");

render(
    MaskingDemo,
    config,
    "masking_vfx_output.mp4",
    {},
    join(process.cwd(), "sketches/masking_vfx_demo.ts")
).then(() => {
    console.log("✨ Render Complete!");
}).catch(err => {
    console.error("❌ Render Failed:", err);
});
