import { render, useFrame } from "../lib/engine.ts";

const config = {
  width: 800,
  height: 800,
  fps: 30,
  duration: 4,
  assets: {
    // Make sure you have this file, or change it!
    "logo": "assets/logo.png" 
  }
};

function ImageVideo() {
  const frame = useFrame();
  const t = frame / 30; 
  
  // Bounce animation
  const y = 300 + Math.sin(t * 5) * 100;
  
  return {
    tag: "view",
    style: {
      width: 800,
      height: 800,
      backgroundColor: "#222",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    },
    children: [
      {
        tag: "text",
        text: "My First Asset",
        style: {
          color: "#eee",
          fontSize: 60,
          margin: 20
        }
      },
      {
        tag: "image",
        src: "logo", // References the key in config.assets
        style: {
          width: 200,
          height: 200,
          padding: y // Moves the image
        }
      }
    ]
  };
}

await render(ImageVideo, config, "image_output.mp4");