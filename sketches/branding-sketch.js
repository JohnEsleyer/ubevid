import { render, startPreview, useFrame } from "../lib/engine.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 4,
  assets: { "bg": "assets/logo.png" },
  fonts: { "Black": "assets/Roboto-Black.ttf" }
};

function BrandingSketch() {
  const frame = useFrame();
  const spacing = Math.sin(frame * 0.1) * 10;

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
          width: 800,
          aspectRatio: 1.77, // Forces 16:9 container
          borderRadius: 20,
          overflow: "hidden",
          backgroundGradient: {
            type: "radial",
            colors: ["#222", "#000"]
          }
        },
        children: [
            {
                tag: "image",
                src: "bg",
                style: { width: 800, height: 450, opacity: 0.3, grayscale: 1, objectFit: "cover" }
            },
            {
                tag: "view",
                style: { position: "absolute", width: 800, height: 450, justifyContent: "center", alignItems: "center" },
                children: [
                    {
                        tag: "text",
                        text: "UBEVED",
                        style: { color: "#fff", fontSize: 120, fontFamily: "Black", letterSpacing: spacing }
                    }
                ]
            }
        ]
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(BrandingSketch, config, "branding_sketch.mp4");
} else {
  startPreview(BrandingSketch, config);
}