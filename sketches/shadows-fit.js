import { render, startPreview, useFrame } from "../lib/engine.ts";

const config = {
  width: 1080, height: 1080, fps: 30, duration: 4,
  assets: { "portrait": "assets/logo.png" },
  fonts: { "Black": "assets/Roboto-Black.ttf" }
};

function ShadowFitSketch() {
  const frame = useFrame();
  const y = Math.sin(frame * 0.1) * 20;

  return {
    tag: "view",
    style: {
      width: 1080, height: 1080,
      backgroundColor: "#f0f0f0",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "view",
        style: {
          width: 500, height: 500,
          backgroundColor: "#fff",
          borderRadius: 40,
          marginTop: y,
          // SHADOWS
          shadowColor: "#000000",
          shadowOffsetX: 20,
          shadowOffsetY: 40,
          overflow: "hidden"
        },
        children: [
          {
            tag: "image",
            src: "portrait",
            style: { 
              width: 500, height: 500,
              objectFit: "cover" // or "contain"
            }
          }
        ]
      },
      {
        tag: "text",
        text: "DEPTH & FIT",
        style: { 
          color: "#111", fontSize: 60, fontFamily: "Black", marginTop: 60 
        }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(ShadowFitSketch, config, "shadow_fit.mp4");
} else {
  startPreview(ShadowFitSketch, config);
}