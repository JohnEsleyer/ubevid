import { render, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 4
};

function AnimationSketch() {
  const frame = useFrame();

  // 1. Fade in the title (0 to 1 opacity over 30 frames)
  const titleOpacity = interpolate(frame, [0, 30], [0, 1]);
  
  // 2. Bounce the square (frames 30 to 90)
  const boxY = interpolate(frame, [30, 90], [-200, 0], Easing.outBounce);
  
  // 3. Constant slow rotation
  const rotation = frame * 2;

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
        text: "ANIMATION SYSTEM",
        style: {
          fontSize: 80,
          color: "#fff",
          opacity: titleOpacity,
          margin: 20
        }
      },
      {
        tag: "rect",
        style: {
          width: 200, height: 200,
          backgroundColor: "#8b5cf6",
          margin: boxY,
          rotate: rotation,
          scale: 1 + Math.sin(frame * 0.1) * 0.2
        }
      }
    ]
  };
}

await render(AnimationSketch, config, "animation_test.mp4");