import { render, startPreview, useFrame } from "../lib/engine.ts";

const config = {
  width: 800, height: 800, fps: 30, duration: 3,
  assets: { "photo": "assets/logo.png" }
};

function ImageRadiusDemo() {
  const frame = useFrame();
  const radius = Math.abs(Math.sin(frame * 0.05) * 200);

  return {
    tag: "view",
    style: {
      width: 800, height: 800,
      backgroundColor: "#222",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "image",
        src: "photo",
        style: {
          width: 400, height: 400,
          borderRadius: radius,
          borderWidth: 10,
          borderColor: "#8b5cf6",
          objectFit: "cover"
        }
      },
      {
          tag: "text",
          text: `Radius: ${Math.round(radius)}`,
          style: { color: "#fff", fontSize: 40, marginTop: 50 }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(ImageRadiusDemo, config, "image_radius.mp4");
} else {
  startPreview(ImageRadiusDemo, config);
}