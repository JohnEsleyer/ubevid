import { render, startPreview, useAudio, useFrame } from "../lib/engine.ts";
import { mapRange } from "../lib/math.ts";

// ⚠️ PREREQUISITE:
// 1. You need an audio file named 'beat.mp3' in an 'assets' folder.
// 2. You need 'Roboto-Black.ttf' in 'assets' folder.

const config = {
  width: 1080, height: 1080, 
  fps: 30, duration: 10,
  assets: { "cover": "assets/logo.png" },
  fonts: { "Black": "assets/Roboto-Black.ttf" },
  audio: "assets/beat.mp3" // This triggers the analysis
};

function AudioVisualizer() {
  const frame = useFrame();
  
  // 1. Get current volume (0.0 to 1.0)
  // We smooth it slightly by averaging with previous frame if we tracked state,
  // but for now we take raw value.
  const volume = useAudio(config.fps);
  
  // 2. Map volume to visual properties
  // When volume is high, circle gets bigger and brighter
  const scale = mapRange(volume, 0, 0.5, 0.8, 1.5); 
  const brightness = mapRange(volume, 0, 0.5, 1.0, 2.5); // Flash effect
  const rotation = frame * 2 + (volume * 20); // Spin faster on beat

  // 3. SVG Path Test (Relative commands)
  // A simple "Play" triangle icon drawn using relative paths (h, v, l)
  const playIconPath = "M 40 20 l 40 30 l -40 30 z"; 

  return {
    tag: "view",
    style: {
      width: 1080, height: 1080,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      // Background Pulse
      {
        tag: "circle",
        style: {
          width: 800, height: 800,
          backgroundColor: "#8b5cf6",
          opacity: 0.2,
          scale: scale * 1.2, // Echo pulse
        }
      },
      // Main Album Art
      {
        tag: "view",
        style: {
          width: 500, height: 500,
          borderRadius: 250,
          borderWidth: 10 + (volume * 20), // Border pulses thickness
          borderColor: "#fff",
          overflow: "hidden",
          shadowColor: "#8b5cf6",
          shadowBlur: 50,
          scale: scale,
          rotate: rotation
        },
        children: [
            {
                tag: "image",
                src: "cover",
                style: {
                    width: 500, height: 500,
                    brightness: brightness, // CORE FEATURE TEST: Brightness filter
                    contrast: 1.1
                }
            }
        ]
      },
      // Relative SVG Path Test (Icon)
      {
        tag: "path",
        d: playIconPath,
        style: {
            position: "absolute", bottom: 100,
            width: 120, height: 100,
            backgroundColor: "#fff",
            opacity: 0.8
        }
      },
      // Volume Bar
      {
        tag: "view",
        style: {
            position: "absolute", bottom: 50,
            width: 500, height: 10,
            backgroundColor: "#333",
            borderRadius: 5,
            alignItems: "flexStart"
        },
        children: [{
            tag: "view",
            style: {
                width: 500 * volume, // Bar fills up
                height: 10,
                backgroundColor: "#8b5cf6",
                borderRadius: 5
            }
        }]
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(AudioVisualizer, config, "audio_viz.mp4");
} else {
  startPreview(AudioVisualizer, config);
}