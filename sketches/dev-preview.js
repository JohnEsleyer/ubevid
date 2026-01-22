import { render, useFrame } from "../lib/engine.ts";
import { startPreview } from "../lib/server.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 5,
  assets: { "logo": "assets/logo.png" }
};

function MyComposition() {
  const frame = useFrame();
  const rotation = interpolate(frame, [0, 150], [0, 360], Easing.inOutQuad);

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#1a1a1a",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "image",
        src: "logo",
        style: { width: 300, height: 300, rotate: rotation }
      },
      {
        tag: "text",
        text: `PREVIEW MODE - FRAME ${frame}`,
        style: { color: "#fff", fontSize: 40, margin: 40 }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(MyComposition, config, "out.mp4");
} else {
  startPreview(MyComposition, config);
}