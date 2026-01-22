import { render, startPreview, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 5,
  assets: { "portrait": "assets/logo.png" },
  fonts: { "Black": "assets/Roboto-Black.ttf" }
};

function MaskingDemo() {
  const frame = useFrame();
  
  // Animate grayscale and movement
  const grayscale = interpolate(frame, [0, 60], [1, 0], Easing.inOutQuad);
  const drift = Math.sin(frame * 0.05) * 50;

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "view",
        style: {
          width: 500, height: 500,
          borderRadius: 250, // Perfect circle
          overflow: "hidden", // CRITICAL: clips the square image to the circle
          borderWidth: 10,
          borderColor: "#8b5cf6"
        },
        children: [
          {
            tag: "image",
            src: "portrait",
            style: { 
              width: 600, height: 600, // Slightly larger than container
              marginLeft: drift - 50,  // Moving inside the mask
              grayscale: grayscale 
            }
          }
        ]
      },
      {
        tag: "text",
        text: "CLIPPING & FILTERS",
        style: {
          color: "#fff", fontSize: 40, fontFamily: "Black", marginTop: 40
        }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(MaskingDemo, config, "masking_output.mp4");
} else {
  startPreview(MaskingDemo, config);
}