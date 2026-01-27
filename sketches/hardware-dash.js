import { render, useFrame } from "../lib/engine.js";
import path from "path";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 2,
};

export default function DashSketch() {
  const frame = useFrame();
  
  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#050505",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "text",
        text: "CHECK TERMINAL DASHBOARD",
        style: { color: "#8b5cf6", fontSize: 60 }
      },
      {
        tag: "rect",
        style: {
          width: 100, height: 100,
          backgroundColor: "#ffffff",
          rotate: frame * 10
        }
      }
    ]
  };
}

const currentFile = path.resolve(import.meta.path);
if (process.argv.includes("--render")) {
  await render(DashSketch, config, "dash_test.mp4", {}, currentFile);
}
