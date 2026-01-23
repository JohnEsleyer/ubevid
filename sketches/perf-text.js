import { render, startPreview, useFrame } from "../lib/engine.ts";

const config = {
  width: 1280, height: 720, fps: 30, duration: 2,
  fonts: { "Regular": "assets/Roboto-Regular.ttf" }
};

function PerfText() {
  const frame = useFrame();
  
  // Creates a large block of text to test caching performance
  // Each character will be cached on first use.
  // Subsequent frames should be much faster.
  const content = Array(50).fill("The quick brown fox jumps over the lazy dog").join(" ");
  
  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center",
      padding: 40
    },
    children: [
      {
        tag: "text",
        text: "GLYPH CACHING TEST",
        style: { color: "#8b5cf6", fontSize: 50, fontFamily: "Regular", marginBottom: 20 }
      },
      {
        tag: "text",
        text: content,
        style: { 
            color: "#666", 
            fontSize: 20, 
            fontFamily: "Regular",
            textAlign: "center",
            lineHeight: 28
        }
      }
    ]
  };
}

if (process.argv.includes("--render")) {
  await render(PerfText, config, "perf_text.mp4");
} else {
  startPreview(PerfText, config);
}
