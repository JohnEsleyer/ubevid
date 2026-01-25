import { render, startPreview, useFrame } from "../lib/engine.ts";
import { interpolate } from "../lib/math.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4,
  assets: { "bg": "assets/logo.png" }
};

function MaskDemoPro() {
  const frame = useFrame();
  const scanX = interpolate(frame, [0, 120], [-200, 1480]);

  return {
    tag: "view",
    style: { width: 1280, height: 720, backgroundColor: "#000" },
    children: [
      // Base layer: Dimmed background
      {
        tag: "image",
        src: "bg",
        style: { width: 1280, height: 720, opacity: 0.2, objectFit: "cover" }
      },
      // Highlight layer: High brightness image revealed by a luminance mask
      {
        tag: "image",
        src: "bg",
        style: { 
          width: 1280, height: 720, 
          objectFit: "cover",
          maskMode: "luminance",
          brightness: 1.5
        },
        mask: {
            tag: "rect",
            style: {
                position: "absolute",
                left: scanX - 100, top: 0,
                width: 200, height: 720,
                backgroundGradient: {
                    type: "linear",
                    angle: 90,
                    colors: ["#00000000", "#ffffff", "#00000000"]
                }
            }
        }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(MaskDemoPro, config, "mask_demo_pro.mp4");
} else {
  startPreview(MaskDemoPro, config);
}