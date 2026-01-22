import { render, startPreview, useFrame } from "../lib/engine.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4,
  fonts: { "Black": "assets/Roboto-Black.ttf" }
};

function LayeringSketch() {
  const frame = useFrame();
  
  // Animate the opacity of the entire group
  const groupOpacity = Math.sin(frame * 0.1) * 0.5 + 0.5;

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
          width: 600, height: 400,
          backgroundColor: "#111",
          borderRadius: 20,
          opacity: groupOpacity, // Children will inherit this!
          justifyContent: "center", alignItems: "center"
        },
        children: [
          // This box is LAST in the array but has zIndex: 1, so it stays on TOP
          {
            tag: "view",
            style: {
              width: 150, height: 150,
              backgroundColor: "#ef4444",
              position: "absolute",
              top: 50, left: 50,
              zIndex: 1 
            }
          },
          // This box is FIRST in the array but has zIndex: 2, so it stays on TOP of the red box
          {
            tag: "view",
            style: {
              width: 150, height: 150,
              backgroundColor: "#8b5cf6",
              position: "absolute",
              top: 100, left: 100,
              zIndex: 2
            }
          },
          {
            tag: "text",
            text: "Z-INDEX & OPACITY",
            style: { color: "#fff", fontSize: 40, fontFamily: "Black", zIndex: 10 }
          }
        ]
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(LayeringSketch, config, "layering_test.mp4");
} else {
  startPreview(LayeringSketch, config);
}