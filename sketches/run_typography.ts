import { render } from "../lib/engine.js";
import TypographyDemo from "./typography_demo.js";
import { join } from "node:path";

const config = {
    width: 1280,
    height: 720,
    fps: 30,
    duration: 5,
    fonts: {
        "Roboto": join(process.cwd(), "assets/Roboto-Bold.ttf")
    }
};

console.log("🚀 Starting Kinetic Typography Render...");

render(
    TypographyDemo,
    config,
    "typography_output.mp4",
    {},
    join(process.cwd(), "sketches/typography_demo.ts")
).then(() => {
    console.log("✨ Render Complete!");
}).catch(err => {
    console.error("❌ Render Failed:", err);
});
