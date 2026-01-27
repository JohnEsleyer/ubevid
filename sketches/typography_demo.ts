import { View, Typewriter, KineticText, CodeBlock, useFrame, useKeyframes, Easing } from "../lib/engine.js";

export default function TypographyDemo() {
    const frame = useFrame();

    const typewriterProgress = useKeyframes({
        0: 0,
        60: 1
    }, Easing.linear);

    const waveOffset = frame * 0.2;

    return View({
        width: "100%",
        height: "100%",
        backgroundColor: "#111827",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40
    }, [
        // 1. Typewriter Effect
        Typewriter({
            text: "> Initializing System...",
            progress: typewriterProgress,
            style: {
                fontSize: 48,
                fontFamily: "monospace",
                color: "#10b981"
            },
            cursorStyle: {
                color: "#34d399",
                opacity: 0.8
            }
        }),

        // 2. Kinetic Text (Wavy)
        KineticText({
            text: "KINETIC TYPOGRAPHY",
            style: {
                fontSize: 64,
                fontFamily: "Roboto",
                color: "#8b5cf6",
                fontWeight: "bold"
            },
            transform: (index) => ({
                top: Math.sin(index * 0.5 + waveOffset) * 10,
                rotate: Math.cos(index * 0.3 + waveOffset) * 5,
                opacity: 0.8 + Math.sin(index * 0.5 + waveOffset) * 0.2
            })
        }),

        // 3. Code Block
        CodeBlock({
            code: `function hello() {
  console.log("Hello World");
  return true;
}`,
            style: {
                width: 600,
                shadowColor: "#000000",
                shadowBlur: 20
            }
        })
    ]);
}
