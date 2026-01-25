import { render, useFrame } from "../lib/engine.ts";
import path from "path";

const config = {
  width: 1920,
  height: 1080,
  fps: 60,
  duration: 5,
};

export default function PerfSketch() {
  const frame = useFrame();
  
  return {
    tag: "view",
    style: {
      width: 1920, height: 1080,
      backgroundColor: "#000",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "rect",
        style: {
          width: 400, height: 400,
          backgroundColor: "#8b5cf6",
          rotate: frame * 5,
          borderRadius: 40
        }
      },
      {
        tag: "text",
        text: `THREADED RENDER: FRAME ${frame}`,
        style: { color: "#fff", fontSize: 60, marginTop: 50 }
      }
    ]
  };
}

// Ensure the absolute path is passed for worker resolution
const currentFile = path.resolve(import.meta.path);
if (process.argv.includes("--render")) {
  await render(PerfSketch, config, "parallel_perf.mp4", {}, currentFile);
}
