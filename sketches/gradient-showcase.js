import { render, startPreview, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4,
  fonts: { "Black": "assets/Roboto-Black.ttf", "Regular": "assets/Roboto-Regular.ttf" }
};

function GradientShowcase() {
  const frame = useFrame();
  
  // Animate gradient angle and scale
  const angle = frame * 2;
  const cardScale = interpolate(frame, [0, 30], [0.8, 1], Easing.outBounce);
  const borderFlash = Math.sin(frame * 0.2) * 5 + 5;

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#000",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "view",
        style: {
          width: 600, height: 350,
          borderRadius: 30,
          borderWidth: borderFlash,
          borderColor: "#8b5cf6",
          scale: cardScale,
          backgroundGradient: {
            colors: ["#1e1e2e", "#8b5cf6", "#d946ef"],
            angle: angle
          },
          justifyContent: "center", alignItems: "center", padding: 40
        },
        children: [
          {
            tag: "text",
            text: "PREMIUM UI",
            style: { color: "#fff", fontSize: 80, fontFamily: "Black", textAlign: "center" }
          },
          {
            tag: "text",
            text: "Gradients & Borders",
            style: { color: "#ffffffaa", fontSize: 30, fontFamily: "Regular", marginTop: 10 }
          }
        ]
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(GradientShowcase, config, "gradient_showcase.mp4");
} else {
  startPreview(GradientShowcase, config);
}