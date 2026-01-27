import {
    View,
    Text,
    ImageComp,
    Effects,
    useFrame,
    useKeyframes,
    Easing
} from "../lib/engine.js";

export default function MaskingDemo() {
    const frame = useFrame();

    // Mask animation: scale a hole in the middle
    const maskScale = useKeyframes({
        0: 0.1,
        60: 2,
        90: 1.5
    }, Easing.outElastic);

    return View({
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center"
    }, [
        // Background with Cinematic effect
        View({
            width: "100%",
            height: "100%",
            backgroundColor: "#2e1065",
            ...Effects.cinematic
        }, [
            Text("VFX & MASKING", {
                fontSize: 120,
                fontWeight: "bold",
                color: "#f472b6",
                letterSpacing: 10,
                textAlign: "center"
            })
        ]),

        // A masked image overlay
        View({
            position: "absolute",
            width: 800,
            height: 500,
            overflow: "hidden",
            borderRadius: 40,
            shadowColor: "#f472b6",
            shadowBlur: 50,
            // Look at this: Masking the View!
            mask: View({
                width: 800,
                height: 500,
                backgroundColor: "transparent",
                justifyContent: "center",
                alignItems: "center"
            }, [
                // The Mask Shape (A white circle on transparent bg = Alpha Mask)
                View({
                    width: 300,
                    height: 300,
                    backgroundColor: "#fff",
                    borderRadius: 150,
                    scale: maskScale
                })
            ])
        }, [
            View({
                width: "100%",
                height: "100%",
                backgroundColor: "#fff",
                justifyContent: "center",
                alignItems: "center"
            }, [
                Text("MASKED CONTENT", { fontSize: 60, color: "#1e1b4b", fontWeight: "bold" })
            ])
        ])
    ]);
}
