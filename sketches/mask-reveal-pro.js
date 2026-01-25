import { render, startPreview, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4,
  assets: { "bg": "assets/logo.png" }
};

function MaskRevealPro() {
  const frame = useFrame();
  
  // Animate a "lens" moving across the screen
  const lensX = interpolate(frame, [0, 120], [-200, 1480], Easing.inOutQuad);

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#050505"
    },
    children: [
      // 1. Grayscale, dim background
      {
        tag: "image",
        src: "bg",
        style: { 
          width: 1280, height: 720, 
          objectFit: "cover", 
          grayscale: 1, 
          opacity: 0.3 
        }
      },
      // 2. Full color, bright "lens" layer
      {
        tag: "image",
        src: "bg",
        style: { 
          width: 1280, height: 720, 
          objectFit: "cover",
          maskMode: "alpha" // Default
        },
        mask: {
          tag: "circle",
          style: {
            position: "absolute",
            width: 400, height: 400,
            left: lensX - 200, top: 360 - 200,
            backgroundColor: "#fff",
            // Add a blur to the mask itself for soft edges!
            blur: 40 
          }
        }
      },
      {
          tag: "text",
          text: "MASK POSITIONING TEST",
          style: {
              position: "absolute", bottom: 40, width: 1280,
              textAlign: "center", color: "#444", fontSize: 24
          }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(MaskRevealPro, config, "mask_reveal_pro.mp4");
} else {
  startPreview(MaskRevealPro, config);
}
