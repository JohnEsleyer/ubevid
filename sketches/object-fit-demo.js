import { render, useFrame } from "../lib/engine.ts";
import path from "path";

// ⚠️ Requires a 'portrait.png' or similar in assets/
const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 3,
  assets: { "photo": "assets/logo.png" }, 
  fonts: { "default": "assets/Roboto-Regular.ttf" }
};

export default function ObjectFitSketch() {
  const frame = useFrame();
  
  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111",
      flexDirection: "row",
      justifyContent: "spaceEvenly", 
      alignItems: "center"
    },
    children: [
      // 1. CONTAIN
      {
        tag: "view",
        // Added flexDirection: "column" to stack image and text vertically
        style: { width: 300, height: 350, backgroundColor: "#222", borderRadius: 10, alignItems: "center", flexDirection: "column", justifyContent: "center" },
        children: [
            {
                tag: "image", src: "photo",
                style: { width: 300, height: 250, objectFit: "contain", backgroundColor: "#000" }
            },
            { tag: "text", text: "CONTAIN", style: { color: "#fff", fontSize: 20, marginTop: 15, fontFamily: "default" } }
        ]
      },
      // 2. COVER
      {
        tag: "view",
        style: { width: 300, height: 350, backgroundColor: "#222", borderRadius: 10, alignItems: "center", flexDirection: "column", justifyContent: "center" },
        children: [
            {
                tag: "image", src: "photo",
                style: { width: 300, height: 250, objectFit: "cover", overflow: "hidden" }
            },
            { tag: "text", text: "COVER", style: { color: "#fff", fontSize: 20, marginTop: 15, fontFamily: "default" } }
        ]
      },
      // 3. FILL (Default)
      {
        tag: "view",
        style: { width: 300, height: 350, backgroundColor: "#222", borderRadius: 10, alignItems: "center", flexDirection: "column", justifyContent: "center" },
        children: [
            {
                tag: "image", src: "photo",
                style: { width: 300, height: 250, objectFit: "fill" } 
            },
            { tag: "text", text: "FILL", style: { color: "#fff", fontSize: 20, marginTop: 15, fontFamily: "default" } }
        ]
      }
    ]
  };
}

const currentFile = path.resolve(import.meta.path);
if (process.argv.includes("--render")) {
  await render(ObjectFitSketch, config, "fit_test.mp4", {}, currentFile);
}