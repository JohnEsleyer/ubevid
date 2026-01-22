import { render, useFrame, startPreview } from "../lib/engine.ts";
import { interpolate } from "../lib/math.ts";

const config = {
  width: 1200, 
  height: 400, 
  fps: 30, 
  duration: 3,
  assets: { "bg": "assets/logo.png" },
  // --- ADD THIS ---
  fonts: { "default": "assets/Roboto-Regular.ttf" } 
};

function AdBanner({ username, discountCode }) {
  const frame = useFrame();
  const slide = interpolate(frame, [0, 20], [-100, 20]);

  return {
    tag: "view",
    style: {
      width: 1200, height: 400, backgroundColor: "#fff",
      flexDirection: "row", alignItems: "center", padding: 40
    },
    children: [
      {
        tag: "image",
        src: "bg",
        style: { width: 300, height: 300, borderRadius: 150 }
      },
      {
        tag: "view",
        style: { marginLeft: 40 },
        children: [
          {
            tag: "text",
            text: `HEY ${username.toUpperCase()}!`,
            // It will use the first loaded font ("default") automatically
            style: { color: "#111", fontSize: 60, fontFamily: "default" }
          },
          {
            tag: "text",
            text: `Use code: ${discountCode}`,
            style: { color: "#8b5cf6", fontSize: 40, marginTop: 10, fontFamily: "default" }
          }
        ]
      },
      {
        tag: "view",
        style: {
          position: "absolute",
          top: slide, right: 20,
          backgroundColor: "#ef4444",
          padding: 10, borderRadius: 8
        },
        children: [
          { tag: "text", text: "LIMITED TIME", style: { color: "#fff", fontSize: 20, fontFamily: "default" } }
        ]
      }
    ]
  };
}

const myData = {
  username: "Ralph",
  discountCode: "UBE2026"
};

if (process.argv.includes("--render")) {
  await render(AdBanner, config, "banner.mp4", myData);
} else {
  startPreview(AdBanner, config, myData);
}