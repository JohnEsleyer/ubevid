import { render, startPreview, useFrame, measurePath } from "../lib/engine.ts";
import { interpolate } from "../lib/math.ts";

const config = { width: 800, height: 600, fps: 30, duration: 3 };

function PathMeasureDemo() {
    const frame = useFrame();
    
    // Complex path
    const d = "M 100 100 Q 400 50 700 100 T 700 500 T 100 500";
    
    // THIS CALL REQUIRES ENGINE TO BE READY
    // In preview mode, it might return 0 on first frame if not awaited?
    // Engine is awaited in `renderSingleFrame` before calling scene.
    const len = measurePath(d);
    
    const offset = interpolate(frame, [0, 90], [len, 0]);

    return {
        tag: "view",
        style: { width: 800, height: 600, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
        children: [
            {
                tag: "text",
                text: `Path Length: ${Math.round(len)}px`,
                style: { color: "#fff", fontSize: 30, position: "absolute", top: 50 }
            },
            {
                tag: "path",
                d: d,
                style: {
                    width: 800, height: 600,
                    position: "absolute",
                    borderWidth: 5,
                    borderColor: "#0f0",
                    strokeDashArray: [len],
                    strokeDashOffset: offset,
                    strokeLineCap: "round"
                }
            }
        ]
    };
}

if (process.argv.includes("--render")) {
  await render(PathMeasureDemo, config, "path_measure.mp4");
} else {
  startPreview(PathMeasureDemo, config);
}