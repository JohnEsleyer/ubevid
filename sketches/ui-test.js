import { render, useFrame } from "../lib/engine.js";
import path from "path";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 2,
};

export default function UIPreview() {
  const frame = useFrame();
  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [{
      tag: "text",
      text: "BEAUTIFUL PROGRESS BAR",
      style: { color: "#8b5cf6", fontSize: 60 }
    }]
  };
}

const currentFile = path.resolve(import.meta.path);
if (process.argv.includes("--render")) {
  await render(UIPreview, config, "ui_test.mp4", {}, currentFile);
}