import { render, useFrame } from "../lib/engine.ts";
import { getHardwareReport } from "../lib/wasm.js";
import path from "path";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 2,
  // 💎 IMPORTANT: You must provide a font file for text to appear
  fonts: { 
    "default": "assets/Roboto-Regular.ttf" 
  }
};

export default function HardwareInfoSketch() {
  const frame = useFrame();
  const report = getHardwareReport();
  const isGpu = report.mode === "gpu";

  const color = isGpu ? "#4ade80" : "#fbbf24";
  const status = isGpu ? "GPU ACCELERATED" : "CPU RENDERING";

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111111", // Dark gray background
      justifyContent: "center", 
      alignItems: "center",
      flexDirection: "column"
    },
    children: [
      {
        tag: "text",
        text: "AMETHYST ENGINE",
        style: { 
            color: "#ffffff", 
            fontSize: 40, 
            fontFamily: "default" 
        }
      },
      {
        tag: "text",
        text: status,
        style: { 
            color: color, 
            fontSize: 80, 
            fontFamily: "default",
            marginTop: 20,
            opacity: 0.8 + Math.sin(frame * 0.1) * 0.2 
        }
      },
      {
        tag: "text",
        text: report.device || "Interrogating Hardware...",
        style: { 
            color: "#666666", 
            fontSize: 24, 
            fontFamily: "default",
            marginTop: 40 
        }
      }
    ]
  };
}

const currentFile = path.resolve(import.meta.path);
if (process.argv.includes("--render")) {
  await render(HardwareInfoSketch, config, "hardware_info.mp4", {}, currentFile);
}