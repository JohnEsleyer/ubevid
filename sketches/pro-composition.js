import { render, useFrame, Sequence } from "../lib/engine.ts";
import { startPreview } from "../lib/server.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 6,
  // audio: "assets/music.mp3" // Uncomment if you have a file
};

function IntroTitle() {
  const frame = useFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  return {
    tag: "text",
    text: "CHAPTER 1: THE BEGINNING",
    style: { color: "#fff", fontSize: 60, opacity }
  };
}

function MovingCircle() {
  const frame = useFrame();
  const x = interpolate(frame, [0, 60], [-400, 400], Easing.inOutQuad);
  return {
    tag: "circle",
    style: { width: 100, height: 100, backgroundColor: "#00ff88", margin: x }
  };
}

function MainScene() {
  const frame = useFrame(); // Global frame
  
  return {
    tag: "view",
    style: {
      width: 1280, height: 720, backgroundColor: "#000",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      // Starts immediately
      Sequence({ from: 0, children: () => IntroTitle() }),
      
      // The circle only starts moving at frame 60 (2 seconds in)
      Sequence({ from: 60, children: () => MovingCircle() }),
      
      // Another circle starts at frame 90
      Sequence({ from: 90, children: () => ({
        tag: "circle",
        style: { width: 50, height: 50, backgroundColor: "#ff0066", margin: 20 }
      })})
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(MainScene, config, "pro_composition.mp4");
} else {
  startPreview(MainScene, config);
}