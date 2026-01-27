import { View, Text, BarChart, useKeyframes, Easing } from "../lib/engine.js";

export default function ChartsDemo() {
    // Animation
    const progress = useKeyframes({
        0: 0,
        60: 1
    }, Easing.outBounce);

    const titleOpacity = useKeyframes({
        0: 0,
        30: 1
    });

    const data = [
        { label: "Rust", value: 90, color: "#dea584" },
        { label: "TypeScript", value: 85, color: "#3178c6" },
        { label: "Bun", value: 95, color: "#fbf0df" },
        { label: "Skia", value: 80, color: "#2f5d02" },
        { label: "Yoga", value: 75, color: "#00d8ff" }
    ];

    return View({
        width: "100%",
        height: "100%",
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 40
    }, [
        Text("Performance Benchmarks 2026", {
            color: "#f3f4f6",
            fontSize: 48,
            fontFamily: "Roboto",
            fontWeight: "bold",
            opacity: titleOpacity,
            marginBottom: 20
        }),

        View({
            width: 800,
            padding: 40,
            backgroundColor: "#1f2937",
            borderRadius: 16,
            shadowColor: "#000000",
            shadowBlur: 30,
            opacity: titleOpacity
        }, [
            BarChart({
                data,
                width: 720,
                height: 400,
                maxValue: 100,
                progress,
                barStyle: {
                    borderRadius: 8
                },
                labelStyle: {
                    fontSize: 18,
                    fontWeight: "bold",
                    marginTop: 10,
                    color: "#d1d5db"
                }
            })
        ])
    ]);
}
