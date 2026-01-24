import { render, startPreview, useFrame } from "../lib/engine.ts";
import { lottieToScene } from "../lib/lottie.ts";

const config = { width: 500, height: 500, fps: 30, duration: 4 };

const mockLottie = {
    fr: 30, ip: 0, op: 120, w: 500, h: 500,
    layers: [
        {
            ty: 4, st: 0, op: 120,
            ks: {
                a: { a: 0, k: [50, 50] }, // Anchor point in middle of the layer's content
                p: { a: 1, k: [
                    { t: 0, s: [250, 250] },  // Center of screen
                    { t: 60, s: [100, 100] }, // Top Left
                    { t: 120, s: [400, 100] } // Top Right
                ]},
                r: { a: 1, k: [{ t: 0, s: 0 }, { t: 120, s: 720 }]},
                s: { a: 0, k: [100, 100] },
                o: { a: 0, k: 100 }
            },
            shapes: [
                { ty: "fl", c: { a: 0, k: [0.54, 0.36, 0.96] } }, // Ube Purple
                { ty: "rc", s: { a: 0, k: [100, 100] }, p: { a: 0, k: [50, 50] }, r: { a: 0, k: 20 } }
            ]
        }
    ]
};

function LottieSketch() {
  const frame = useFrame();
  return {
      tag: "view",
      style: { width: 500, height: 500, backgroundColor: "#111" },
      children: [lottieToScene(mockLottie, frame)]
  };
}

if (process.argv.includes("--render")) {
  await render(LottieSketch, config, "lottie_out.mp4");
} else {
  startPreview(LottieSketch, config);
}
