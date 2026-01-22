import { render, startPreview, useFrame } from "../lib/engine.ts";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 5,
  fonts: { 
    "Regular": "assets/Roboto-Regular.ttf",
    "Black": "assets/Roboto-Black.ttf",
    "Light": "assets/Roboto-Light.ttf"
  }
};

function TypographySketch() {
  const frame = useFrame();
  const containerWidth = 500 + Math.sin(frame * 0.05) * 200;

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#050505",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "view",
        style: {
          width: containerWidth,
          padding: 40,
          backgroundColor: "#111",
          borderRadius: 24,
        },
        children: [
          {
            tag: "text",
            text: "WORD WRAPPING",
            style: {
              color: "#8b5cf6",
              fontSize: 60,
              fontFamily: "Black",
              textAlign: "center"
            }
          },
          {
            tag: "text",
            text: "Ubevid now uses a word-aware wrapping algorithm. It respects spaces and calculates horizontal alignment like center or right-aligned text within its Flexbox container.",
            style: {
              color: "#aaa",
              fontSize: 28,
              marginTop: 20,
              fontFamily: "Regular",
              textAlign: "left",
              lineHeight: 36
            }
          },
          {
            tag: "text",
            text: "STAY DETERMINISTIC.",
            style: {
              color: "#fff",
              fontSize: 20,
              marginTop: 30,
              fontFamily: "Light",
              textAlign: "right"
            }
          }
        ]
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(TypographySketch, config, "typo_test.mp4");
} else {
  startPreview(TypographySketch, config);
}