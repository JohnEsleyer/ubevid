import { render, useFrame } from "../lib/engine.ts";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 5
};

function TextShowcase() {
  const frame = useFrame();
  const t = frame / 30;

  // Animate values
  const bounce = Math.abs(Math.sin(t * 3) * 50);
  const opacityVal = Math.floor(Math.abs(Math.sin(t * 2) * 255));
  const dynamicColor = `#fbbf24${opacityVal.toString(16).padStart(2, '0')}`;

  return {
    tag: "view",
    style: {
      width: 1280,
      height: 720,
      backgroundColor: "#0f172a", // Deep Blue
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    },
    children: [
      {
        tag: "text",
        text: "UBEVID ENGINE",
        style: {
          color: "#38bdf8", // Sky Blue
          fontSize: 100,
          margin: 10
        }
      },
      {
        tag: "text",
        text: "Deterministic GPU-Optional Video",
        style: {
          color: "#94a3b8", // Slate
          fontSize: 40,
          margin: 20
        }
      },
      {
        tag: "view",
        style: {
          backgroundColor: "#1e293b",
          padding: 30,
          margin: 50 + bounce,
          justifyContent: "center",
          alignItems: "center"
        },
        children: [
          {
            tag: "text",
            text: `FRAME: ${frame}`,
            style: {
              color: dynamicColor,
              fontSize: 60
            }
          }
        ]
      },
      {
        tag: "text",
        text: "Built with Rust + Bun",
        style: {
          color: "#f472b6", // Pink
          fontSize: 30,
          margin: 10
        }
      }
    ]
  };
}

await render(TextShowcase, config, "text_showcase.mp4");