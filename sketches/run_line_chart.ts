import { render } from "../lib/engine.js";
import LineChartDemo from "./line_chart_demo.js";
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

console.log("🚀 Starting Line Chart Render...");

render(
    LineChartDemo,
    config,
    "line_chart_output.mp4",
    {},
    join(process.cwd(), "sketches/line_chart_demo.ts")
).then(() => {
    console.log("✨ Render Complete!");
}).catch(err => {
    console.error("❌ Render Failed:", err);
});
