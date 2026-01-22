import { render, useFrame } from "../lib/engine.ts";

const config = {
  width: 1080,
  height: 1080,
  fps: 60,
  duration: 5
};

function MyVideo() {
  const frame = useFrame();
  const t = frame / 60;

  return {
    tag: "view",
    style: {
      width: 1080,
      height: 1080,
      backgroundColor: "#050505",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    },
    children: [
      {
        tag: "rect",
        style: {
          width: 400,
          height: 400,
          backgroundColor: "#ff3e00",
          rotate: t * 180, // 180 degrees per second
          scale: 1 + Math.sin(t * 4) * 0.2, // Pulsing
          justifyContent: "center",
          alignItems: "center"
        },
        children: [
            {
                tag: "rect",
                style: {
                    width: 100,
                    height: 100,
                    backgroundColor: "#ffffff",
                    rotate: -t * 360 // Counter-rotation
                }
            }
        ]
      }
    ]
  };
}

await render(MyVideo, config, "pro_output.mp4");