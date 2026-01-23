import { render, startPreview, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 4
};

function StrokeDemo() {
  const frame = useFrame();
  
  // Animate the path drawing (stroke-dashoffset technique)
  // Approximate length of the infinity symbol path is ~1500 units
  const totalLen = 1500;
  
  // Animate from totalLen (invisible) to 0 (fully drawn)
  const drawProgress = interpolate(frame, [0, 60], [totalLen, 0], Easing.inOutQuad);
  
  // Animate color
  const hue = interpolate(frame, [0, 120], [0, 360]);

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "text",
        text: "VECTOR STROKES",
        style: { color: "#333", fontSize: 100, position: "absolute", top: 100 }
      },
      // The Infinity Symbol Path
      {
        tag: "path",
        d: "M 300 360 C 300 200 600 200 640 360 C 680 520 980 520 980 360 C 980 200 680 200 640 360 C 600 520 300 520 300 360 Z",
        style: {
          width: 1280, height: 720,
          position: "absolute",
          
          // Styling
          borderColor: `hsl(${hue}, 80%, 60%)`, // Dynamic Color (handled by CSS parser if strict, but Rust parser handles hex mainly. Let's use hex for safety if engine only supports hex)
          borderColor: "#8b5cf6", // Fallback / Static for now
          borderWidth: 15,
          
          // Advanced Stroke Props
          strokeLineCap: "round",
          strokeLineJoin: "round",
          strokeDashArray: [totalLen], // Dash pattern: [dash, gap] - here [totalLen] implies solid line if offset is 0
          strokeDashOffset: drawProgress, // Animating this makes the line "grow"
          
          // Shadow glow
          shadowColor: "#8b5cf6",
          shadowBlur: 20
        }
      },
      // Dashed Circle Border
      {
        tag: "view",
        style: {
            width: 800, height: 600,
            position: "absolute",
            borderColor: "#444",
            borderWidth: 2,
            borderRadius: 30,
            strokeDashArray: [20, 10], // Dotted line
            strokeDashOffset: frame * 2 // Marching ants effect
        }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(StrokeDemo, config, "stroke_demo.mp4");
} else {
  // To use Live Reload: run `bun --watch sketches/stroke-demo.js`
  startPreview(StrokeDemo, config);
}