import { View, Text, LineChart, useKeyframes, Easing } from "../lib/engine.js";

export default function LineChartDemo() {
    const progress = useKeyframes({
        0: 0,
        90: 1
    }, Easing.inOutQuad);

    const data = [
        { label: "Jan", value: 30, color: "#fff" },
        { label: "Feb", value: 50, color: "#fff" },
        { label: "Mar", value: 45, color: "#fff" },
        { label: "Apr", value: 80, color: "#fff" },
        { label: "May", value: 70, color: "#fff" },
        { label: "Jun", value: 90, color: "#fff" },
        { label: "Jul", value: 100, color: "#fff" }
    ];

    return View({
        width: "100%",
        height: "100%",
        backgroundColor: "#000000ff",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 50
    }, [
        Text("Growth Curve (SVG Paths)", {
            color: "#fff",
            fontSize: 48,
            fontFamily: "Roboto",
            fontWeight: "bold",
            marginBottom: 20
        }),

        View({
            width: 800,
            height: 500,
            padding: 40,
            borderColor: "#333",
            borderWidth: 2,
            borderRadius: 20
        }, [
            LineChart({
                data,
                width: 720,
                height: 400,
                maxValue: 120,
                progress,
                lineStyle: {
                    stroke: "#8b5cf6",
                    strokeWidth: 6,
                    shadowColor: "#8b5cf6",
                    shadowBlur: 20
                }
            })
        ])
    ]);
}
