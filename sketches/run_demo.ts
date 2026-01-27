import { render } from "../lib/engine.js";
import Demo from "./demo.js";
import { join } from "node:path";

const config = {
    width: 1280,
    height: 720,
    fps: 30,
    duration: 5,
    fonts: {
        "Roboto": join(process.cwd(), "assets/Roboto-Bold.ttf")
    },
    motionBlurSamples: 4, // Demonstrate motion blur
    shutterAngle: 180
};

console.log("🚀 Starting Amethyst Native Render...");

render(
    Demo,
    config,
    "demo_output.mp4",
    {},
    join(process.cwd(), "sketches/demo.ts")
).then(() => {
    console.log("✨ Render Complete!");
}).catch(err => {
    console.error("❌ Render Failed:", err);
});
