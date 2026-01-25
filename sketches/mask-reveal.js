import { render, startPreview, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4,
  assets: { "bg": "assets/logo.png" }
};

function MaskReveal() {
  const frame = useFrame();
  
  // Reveal circle moving from left to right
  const revealX = interpolate(frame, [0, 90], [-200, 1480], Easing.inOutQuad);

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111"
    },
    children: [
      {
        tag: "image",
        src: "bg",
        style: { 
          width: 1280, height: 720, 
          objectFit: "cover",
          maskMode: "alpha"
        },
        mask: {
          tag: "circle",
          style: {
            position: "absolute",
            width: 400, height: 400,
            left: revealX - 200, top: 360 - 200,
            backgroundColor: "#fff"
          }
        }
      },
      {
          tag: "text",
          text: "DYNAMIC REVEAL MASK",
          style: { 
            position: "absolute", bottom: 50, width: 1280,
            textAlign: "center", color: "#666", fontSize: 30 
          }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(MaskReveal, config, "reveal.mp4");
} else {
  startPreview(MaskReveal, config);
}