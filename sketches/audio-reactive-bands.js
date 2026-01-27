import { render, useFrame, useAudioFrequency, Sequence } from "../lib/engine.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 5,
  audio: "assets/beat.mp3",
  fonts: { "default": "assets/Roboto-Regular.ttf" }
};

export default function AudioBands() {
  const frame = useFrame();
  const { bass, mid, treble } = useAudioFrequency(config.fps);

  return {
    tag: "view",
    style: {
      width: 1280, height: 720, backgroundColor: "#000",
      justifyContent: "center", alignItems: "center", flexDirection: "row"
    },
    children: [
        // Bass Bar
        {
            tag: "view",
            style: {
                width: 100, height: 100 + (bass * 400),
                backgroundColor: "#ff0066", margin: 20, borderRadius: 10
            }
        },
        // Mid Bar
        {
            tag: "view",
            style: {
                width: 100, height: 100 + (mid * 300),
                backgroundColor: "#00ff88", margin: 20, borderRadius: 10
            }
        },
        // Treble Bar
        {
            tag: "view",
            style: {
                width: 100, height: 100 + (treble * 200),
                backgroundColor: "#00ccff", margin: 20, borderRadius: 10
            }
        },
        // A sequence that only appears after 2 seconds
        Sequence({
            from: 60,
            children: () => ({
                tag: "text",
                text: "DROP THE BASS",
                style: { 
                    position: "absolute", top: 100, color: "#fff", 
                    fontSize: 40, fontFamily: "default",
                    scale: 1 + bass * 0.5
                }
            })
        })
    ]
  };
}

import path from "path";
const currentFile = path.resolve(import.meta.path);
if (process.argv.includes("--render")) {
  await render(AudioBands, config, "reactive_bands.mp4", {}, currentFile);
}