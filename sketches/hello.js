import { render, useFrame } from "../lib/engine.js";
import path from "path";

const config = { 
  width: 1280, height: 720, fps: 30, duration: 5 
};

export default function MyVideo() {
  const frame = useFrame();
  
  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#0a0a0a",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "rect",
        style: {
          width: 400, height: 400,
          backgroundColor: "#8b5cf6",
          rotate: frame * 2,
          borderRadius: 40
        }
      }
    ]
  };
}

// Identify the current file for the Worker pool
const currentFile = path.resolve(import.meta.path);

if (process.argv.includes("--render")) {
  await render(MyVideo, config, "output.mp4", {}, currentFile);
}
