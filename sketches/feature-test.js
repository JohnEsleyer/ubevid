import { render, startPreview, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4,
  fonts: { "Black": "assets/Roboto-Black.ttf" }
};

function FeatureTest() {
  const frame = useFrame();
  const rotation = frame * 5;
  const shadowMove = Math.sin(frame * 0.1) * 20 + 20;

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#0a0a0a",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      // 1. Individual Corner Radii Test
      {
        tag: "view",
        style: {
          width: 300, height: 300,
          backgroundColor: "#8b5cf6",
          borderTopLeftRadius: 100,
          borderBottomRightRadius: 100,
          margin: 40,
          shadowColor: "#000000",
          shadowOffsetX: shadowMove,
          shadowOffsetY: shadowMove
        },
        children: [{
            tag: "text",
            text: "CORNERS",
            style: { color: "#fff", fontSize: 40, textAlign: "center", marginTop: 120 }
        }]
      },
      // 2. SVG Path Test (A simple star-like shape parsed via svgtypes)
      {
        tag: "path",
        d: "M 150 0 L 180 120 L 300 120 L 200 190 L 240 300 L 150 230 L 60 300 L 100 190 L 0 120 L 120 120 Z",
        style: {
          width: 300, height: 300,
          backgroundColor: "#f472b6",
          rotate: rotation,
          margin: 40
        }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(FeatureTest, config, "feature_test.mp4");
} else {
  startPreview(FeatureTest, config);
}