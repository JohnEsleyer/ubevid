import { render, startPreview, useFrame } from "../lib/engine.ts";

const config = {
  width: 1080, height: 1080, fps: 30, duration: 3,
  fonts: { 
    "Regular": "assets/Roboto-Regular.ttf",
    "Black": "assets/Roboto-Black.ttf"
  }
};

function TextLayoutDemo() {
  const frame = useFrame();
  const widthAnim = 500 + Math.sin(frame * 0.1) * 200;

  return {
    tag: "view",
    style: {
      width: 1080, height: 1080,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "view",
        style: {
          width: widthAnim,
          backgroundColor: "#222",
          padding: 40,
          borderRadius: 20,
          borderColor: "#444",
          borderWidth: 2,
          // IMPORTANT: Column layout ensures text nodes stack vertically instead of overlapping
          flexDirection: "column"
        },
        children: [
          {
            tag: "text",
            text: "MULTILINE\nSUPPORT",
            style: {
              color: "#8b5cf6",
              fontSize: 80,
              fontFamily: "Black",
              textAlign: "center",
              lineHeight: 85,
              marginBottom: 30
            }
          },
          {
            tag: "text",
            text: "This text automatically wraps when the container gets too small.\n\nIt also respects manual newlines (like the one before this sentence).",
            style: {
              color: "#ccc",
              fontSize: 32,
              fontFamily: "Regular",
              textAlign: "left",
              lineHeight: 48
            }
          }
        ]
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(TextLayoutDemo, config, "text_layout.mp4");
} else {
  startPreview(TextLayoutDemo, config);
}