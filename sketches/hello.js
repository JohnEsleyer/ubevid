import { render, useFrame } from "../lib/engine.ts";

const config = {
  width: 1280,
  height: 720,
  fps: 30,
  duration: 3
};

function MyVideo() {
  const frame = useFrame();
  const t = frame / 30; // time in seconds

  const move = Math.sin(t * 3) * 300;
  const colorVal = Math.floor(Math.abs(Math.sin(t) * 255));
  const color = `#${colorVal.toString(16).padStart(2,'0')}0088`;

  return {
    tag: "view",
    style: {
      width: 1280,
      height: 720,
      backgroundColor: "#111",
      padding: 50,
      // Flexbox centering!
      flex: 1, 
    },
    children: [
      {
        tag: "rect",
        style: {
          width: 200,
          height: 200,
          backgroundColor: color,
          margin: 200 + move // Simple margin animation
        }
      }
    ]
  };
}

await render(MyVideo, config, "output.mp4");