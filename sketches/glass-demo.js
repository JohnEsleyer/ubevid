import { render, startPreview, useFrame } from "../lib/engine.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4,
  assets: { "bg": "assets/logo.png" },
  fonts: { "Black": "assets/Roboto-Black.ttf" }
};

function GlassDemo() {
  const frame = useFrame();
  const blurVal = 10 + Math.sin(frame * 0.1) * 10; // Animate blur
  
  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#000",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      // 1. Background Image (Blurred)
      {
        tag: "image",
        src: "bg",
        style: {
          width: 1280, height: 720,
          position: "absolute",
          objectFit: "cover",
          blur: Math.abs(blurVal), // Dynamic Blur!
          brightness: 0.7
        }
      },
      // 2. Foreground Card
      {
        tag: "view",
        style: {
          width: 600, height: 300,
          backgroundColor: "#ffffff22", // Semi-transparent
          borderColor: "#ffffff66",
          borderWidth: 2,
          borderRadius: 20,
          justifyContent: "center", alignItems: "center",
          shadowColor: "#000000",
          shadowBlur: 30
        },
        children: [
            {
                tag: "text",
                text: "GLASSMORPHISM",
                style: {
                    color: "#fff", fontSize: 60, fontFamily: "Black",
                    shadowColor: "#000", shadowOffsetY: 4
                }
            },
            {
                tag: "text",
                text: `Blur Radius: ${Math.round(Math.abs(blurVal))}px`,
                style: { color: "#eee", fontSize: 24, marginTop: 20 }
            }
        ]
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(GlassDemo, config, "glass_demo.mp4");
} else {
  startPreview(GlassDemo, config);
}