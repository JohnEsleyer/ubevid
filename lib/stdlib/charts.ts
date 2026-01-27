import { View, Text } from "../components.js";
import { mapRange } from "../math.js";
import type { SceneNode, StyleConfig } from "../types.js";

export interface ChartData {
    label: string;
    value: number;
    color?: string;
}

export function BarChart(props: {
    data: ChartData[];
    width?: number;
    height?: number;
    maxValue: number;
    progress?: number; // 0 to 1 for animation
    style?: StyleConfig;
    barStyle?: StyleConfig;
    labelStyle?: StyleConfig;
}): SceneNode {
    const {
        data,
        width = 600,
        height = 400,
        maxValue,
        progress = 1,
        style = {},
        barStyle = {},
        labelStyle = {}
    } = props;

    // Filter data based on visibility or leave logic simplified for now

    return View({
        width,
        height,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between", // Distribute bars evenly
        gap: 10,
        ...style
    }, data.map((item, index) => {
        // Stagger animation: each bar starts a bit later
        // progress 0..1
        // item 0 starts at 0, item N starts at 0.5?

        // Simple synchronous animation for v1
        const itemHeight = mapRange(item.value, 0, maxValue, 0, height) * progress;

        return View({
            flexDirection: "column",
            alignItems: "center",
            width: "100%", // Flex grow to fill space
            gap: 8
        }, [
            // The Bar
            View({
                width: "100%",
                height: Math.max(1, itemHeight), // Minimum 1px to avoid 0 height issues
                backgroundColor: item.color || barStyle.backgroundColor || "#3b82f6",
                borderRadius: barStyle.borderRadius || 4,
                ...barStyle
            }),
            // The Label
            Text(item.label, {
                fontSize: 14,
                color: "#9ca3af",
                textAlign: "center",
                ...labelStyle
            })
        ]);
    }));
}

export function LineChart(props: {
    data: ChartData[];
    width?: number;
    height?: number;
    maxValue: number;
    progress?: number;
    style?: StyleConfig;
    lineStyle?: StyleConfig;
}): SceneNode {
    const {
        data,
        width = 600,
        height = 400,
        maxValue,
        progress = 1,
        style = {},
        lineStyle = {}
    } = props;

    // Generate Path Data
    const step = width / (data.length - 1);

    // Animate width of the path or dash offset?
    // For simple "reveal", we clip the path width or use stroke-dash.
    // Let's use drawing points based on progress for now.

    // Calculate visible path length based on progress? 
    // Easier approach: Dash Offset animation.

    // Build path 'd' string
    const points = data.map((item, i) => {
        const x = i * step;
        const y = height - mapRange(item.value, 0, maxValue, 0, height);
        return { x, y };
    });

    if (points.length === 0) return View({ width, height });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        // Linear interpolation for now, Catmull-Rom or Bezier would be better for version 2
        d += ` L ${points[i].x} ${points[i].y}`;
    }

    // Dash Array Logic for animation
    // Ideally we measure path length, but for now let's just use a large enough number
    const pathLength = width * 2; // Approximate
    const dashOffset = pathLength * (1 - progress);

    return View({
        width,
        height,
        position: "relative",
        ...style
    }, [
        // The Line
        {
            tag: "path",
            d,
            style: {
                fill: undefined,
                stroke: lineStyle.stroke || "#3b82f6",
                strokeWidth: lineStyle.strokeWidth || 4,
                strokeLineCap: "round",
                strokeLineJoin: "round",
                strokeDashArray: [pathLength],
                strokeDashOffset: dashOffset,
                ...lineStyle
            }
        },
        // Dots
        ...data.map((item, i) => {
            if (progress < (i / data.length)) return { tag: "view", style: { display: "none" } } as SceneNode;
            const x = i * step;
            const y = height - mapRange(item.value, 0, maxValue, 0, height);

            return View({
                position: "absolute",
                left: x - 6,
                top: y - 6,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: item.color || "#ffffff",
                borderWidth: 2,
                borderColor: lineStyle.stroke || "#3b82f6"
            });
        })
    ]);
}
