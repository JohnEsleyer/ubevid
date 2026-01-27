import { render, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";
import path from "path";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 3,
};

export default function PercentageSketch() {
  const frame = useFrame();
  
  // Animate width from 0% to 80% over 60 frames
  const widthPct = interpolate(frame, [0, 60], [0, 80], Easing.inOutQuad);
  
  // Animate height from 5% to 50%
  const heightPct = interpolate(frame, [0, 60], [5, 50], Easing.outBounce);

  return {
    tag: "view",
    style: {
      width: "100%", height: "100%",
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "view",
        style: {
          // Dynamic percentage strings!
          width: `${widthPct}%`, 
          height: `${heightPct}%`,
          backgroundColor: "#8b5cf6",
          borderRadius: 20,
          justifyContent: "center", alignItems: "center"
        },
        children: [
            {
                tag: "text",
                // Show the calculated width text if the box is big enough
                text: widthPct > 20 ? `${Math.round(widthPct)}%` : "",
                style: { 
                    color: "#fff", 
                    fontSize: 40,
                    opacity: widthPct / 80 // Fade in text
                }
            }
        ]
      }
    ]
  };
}

const currentFile = path.resolve(import.meta.path);
if (process.argv.includes("--render")) {
  await render(PercentageSketch, config, "percent_test.mp4", {}, currentFile);
}