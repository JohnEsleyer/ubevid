import { render, startPreview, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

// ⚠️ Ensure you have a 'video.mp4' in assets/
const config = {
  width: 1280, height: 720, fps: 30, duration: 5,
  assets: { "overlay": "assets/logo.png" },
  videos: { "bg_vid": "assets/video.mp4" }
};

function VideoComposition() {
  const frame = useFrame();
  const scale = interpolate(frame, [0, 60], [1.2, 1.0], Easing.outQuad);
  const blurVal = interpolate(frame, [90, 120], [0, 20]);

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#000",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      // 1. Video Layer (treated as image by core, updated every frame by engine)
      {
        tag: "image",
        src: "bg_vid",
        style: {
          width: 1280, height: 720,
          position: "absolute",
          scale: scale, // Slight zoom out effect on video
          blur: blurVal, // Blur the video at the end
          objectFit: "cover"
        }
      },
      // 2. Overlay UI
      {
        tag: "view",
        style: {
          width: 1280, height: 720,
          justifyContent: "center", alignItems: "center",
          backgroundColor: "#00000044" // Dim layer
        },
        children: [
            {
                tag: "image",
                src: "overlay",
                style: { width: 200, height: 200, opacity: 0.8 }
            },
            {
                tag: "text",
                text: "VIDEO SUPPORT",
                style: { 
                    color: "#fff", fontSize: 60, marginTop: 20,
                    shadowColor: "#000", shadowBlur: 10
                }
            }
        ]
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(VideoComposition, config, "video_output.mp4");
} else {
  startPreview(VideoComposition, config);
}