import { render, startPreview, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280, height: 720, 
  fps: 30, duration: 2,
  // 💡 Enable Motion Blur here
  motionBlurSamples: 8, 
  shutterAngle: 180 
};

function MotionBlurDemo() {
  const frame = useFrame();
  
  // Fast moving object
  const x = interpolate(frame, [0, 30], [-200, 1480], Easing.inOutQuad);
  
  // Rotating square
  const r = frame * 20;

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
        text: "TEMPORAL MOTION BLUR",
        style: { color: "#333", fontSize: 80, position: "absolute", top: 100 }
      },
      // Fast Ball
      {
        tag: "circle",
        style: {
          width: 100, height: 100,
          backgroundColor: "#ef4444",
          position: "absolute",
          left: x, top: 360 - 50,
          shadowColor: "#ef4444", shadowBlur: 20
        }
      },
      // Spinning Square
      {
        tag: "rect",
        style: {
          width: 200, height: 200,
          backgroundColor: "#3b82f6",
          marginTop: 200,
          rotate: r,
          borderWidth: 5,
          borderColor: "#fff"
        }
      },
      {
          tag: "text",
          text: `Samples: ${config.motionBlurSamples || 0}`,
          style: { color: "#666", fontSize: 24, position: "absolute", bottom: 20 }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(MotionBlurDemo, config, "motion_blur.mp4");
} else {
  startPreview(MotionBlurDemo, config);
}