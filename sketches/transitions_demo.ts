import {
    View,
    Text,
    ImageComp,
    Transitions,
    useFrame,
    useKeyframes,
    Easing
} from "../lib/engine.js";

function SceneA() {
    return View({
        width: "100%",
        height: "100%",
        backgroundColor: "#1e3a8a",
        justifyContent: "center",
        alignItems: "center"
    }, [
        Text("SCENE A", { fontSize: 80, fontWeight: "bold", color: "#fff" })
    ]);
}

function SceneB() {
    return View({
        width: "100%",
        height: "100%",
        backgroundColor: "#111827",
        justifyContent: "center",
        alignItems: "center"
    }, [
        Text("SCENE B", { fontSize: 80, fontWeight: "bold", color: "#8b5cf6" })
    ]);
}

export default function TransitionsDemo() {
    const frame = useFrame();

    // Transition progress: 0 to 1 between frame 30 and 60
    const progress = useKeyframes({
        30: 0,
        60: 1
    }, Easing.inOutCubic);

    return View({
        width: "100%",
        height: "100%",
        backgroundColor: "#000"
    }, [
        Transitions.slide(SceneA(), SceneB(), progress, "left"),

        // Overlay info
        View({
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            alignItems: "center"
        }, [
            Text(`Progress: ${(progress * 100).toFixed(0)}%`, {
                fontSize: 24,
                color: "#94a3b8",
                backgroundColor: "rgba(0,0,0,0.5)",
                padding: 10,
                borderRadius: 8
            })
        ])
    ]);
}
