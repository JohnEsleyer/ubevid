import { render } from "../lib/engine.js";
import TransitionsDemo from "./transitions_demo.js";
import { join } from "node:path";

const config = {
    width: 1280,
    height: 720,
    fps: 30,
    duration: 3, // 3 seconds
    fonts: {
        "Roboto": join(process.cwd(), "assets/Roboto-Bold.ttf")
    }
};

console.log("🚀 Starting Transitions Render...");

render(
    TransitionsDemo,
    config,
    "transitions_output.mp4",
    {},
    join(process.cwd(), "sketches/transitions_demo.ts")
).then(() => {
    console.log("✨ Render Complete!");
}).catch(err => {
    console.error("❌ Render Failed:", err);
});
