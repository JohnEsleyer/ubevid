
import { render, startPreview, useFrame } from "../lib/engine.ts";
import { noise, mapRange } from "../lib/math.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4,
  assets: { "bg": "assets/logo.png" }
};

function BlendModeDemo() {
  const frame = useFrame();
  const time = frame * 0.05;

  // Generate particles using Noise
  const particles = [];
  for (let i = 0; i < 20; i++) {
      const nX = noise(i * 10, time * 0.5);
      const nY = noise(i * 10 + 100, time * 0.5);
      const x = mapRange(nX, -1, 1, 0, 1280);
      const y = mapRange(nY, -1, 1, 0, 720);
      const size = mapRange(noise(i, time), -1, 1, 50, 200);
      
      particles.push({
          tag: "circle",
          style: {
              position: "absolute",
              left: x, top: y,
              width: size, height: size,
              backgroundColor: i % 2 === 0 ? "#00ffff" : "#ff00ff",
              blendMode: "screen", // Additive blending
              opacity: 0.6,
              blur: 10
          }
      });
  }

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#000",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "image",
        src: "bg",
        style: { width: 800, height: 450, opacity: 0.5 }
      },
      // Overlay layer with Difference mode
      {
          tag: "rect",
          style: {
              position: "absolute",
              width: 1280, height: 720,
              backgroundColor: "#fff",
              blendMode: "difference",
              opacity: 1
          },
          // Animate the mask/rect width
          style: {
              position: "absolute",
              width: 200, height: 720,
              left: mapRange(Math.sin(time), -1, 1, 0, 1080),
              backgroundColor: "#ffffff",
              blendMode: "difference"
          }
      },
      ...particles
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(BlendModeDemo, config, "blend_demo.mp4");
} else {
  startPreview(BlendModeDemo, config);
}