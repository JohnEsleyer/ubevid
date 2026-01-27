import {
    View,
    Text,
    ImageComp,
    Sequence,
    useFrame,
    useKeyframes,
    Easing
} from "../lib/engine.js";

export default function Demo() {
    const frame = useFrame();

    // Animation via keyframes
    const opacity = useKeyframes({
        0: 0,
        30: 1,
        60: 1,
        90: 0
    });

    const yOffset = useKeyframes({
        0: 100,
        60: 0
    }, Easing.outBounce);

    const logoRotate = frame * 2;

    return View({
        width: "100%",
        height: "100%",
        backgroundColor: "#0a0a0c",
        justifyContent: "center",
        alignItems: "center"
    }, [
        // Main Container
        View({
            flexDirection: "column",
            alignItems: "center",
            padding: 40,
            borderRadius: 20,
            backgroundColor: "#1a1a1e",
            borderWidth: 2,
            borderColor: "#333",
            opacity,
            top: yOffset
        }, [
            // Logo
            ImageComp("assets/logo.png", {
                width: 120,
                height: 120,
                marginBottom: 20,
                rotate: logoRotate,
                borderRadius: 60,
                overflow: "hidden"
            }),

            // Title
            Text("AMETHYST NATIVE", {
                fontSize: 48,
                color: "#a855f7",
                fontFamily: "Roboto",
                marginBottom: 10,
                blur: frame < 20 ? (20 - frame) / 2 : 0
            }),

            // Subtitle
            Text("Skia + Yoga + Bun", {
                fontSize: 24,
                color: "#94a3b8",
                fontFamily: "Roboto"
            }),

            // Layout Test
            View({
                flexDirection: "row",
                marginTop: 30,
                gap: 15
            }, [
                View({ width: 40, height: 40, backgroundColor: "#ef4444", borderRadius: 8 }),
                View({ width: 40, height: 40, backgroundColor: "#22c55e", borderRadius: 8 }),
                View({ width: 40, height: 40, backgroundColor: "#3b82f6", borderRadius: 8 })
            ])
        ])
    ]);
}
