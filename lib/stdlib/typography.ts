import { View, Text, ComponentProps } from "../components.js";
import { State } from "../state.js";
import type { SceneNode, StyleConfig } from "../types.js";

/**
 * Basic Typewriter Effect
 * Reveals text character by character based on a progress value (0 to 1).
 */
export function Typewriter(props: {
    text: string;
    progress: number; // 0 to 1
    style?: ComponentProps;
    cursor?: string;
    cursorStyle?: StyleConfig;
}): SceneNode {
    const { text, progress, style = {}, cursor = "|", cursorStyle = {} } = props;

    // Calculate how many characters to show
    const length = Math.floor(text.length * Math.max(0, Math.min(1, progress)));
    const visibleText = text.substring(0, length);
    const showCursor = progress < 1 && Math.floor(State.frame / 10) % 2 === 0;

    return View({
        flexDirection: "row",
        alignItems: "baseline",
        ...style // Allow container styling
    }, [
        Text(visibleText, style),
        showCursor ? Text(cursor, { color: style.color, fontSize: style.fontSize, ...cursorStyle }) : View({})
    ]);
}

/**
 * KineticText Primitive
 * Allows per-character transforms based on an index.
 * Useful for wavy text, shaking text, or complex reveals.
 */
export function KineticText(props: {
    text: string;
    style?: ComponentProps;
    transform: (index: number, char: string) => StyleConfig;
}): SceneNode {
    const { text, style = {}, transform } = props;
    const chars = text.split("");

    return View({
        flexDirection: "row",
        flexWrap: "wrap",
        ...style
    }, chars.map((char, index) => {
        // Space handling: render a space with width but preserve layout flow
        if (char === " ") {
            return View({ width: (style.fontSize || 20) * 0.3, height: 1 });
        }

        const charStyle = transform(index, char);
        return Text(char, {
            ...style, // Inherit base styles
            ...charStyle, // Apply per-char transform
            position: "relative" // Allow transforms to work relative to flow
        });
    }));
}

/**
 * Standard CodeBlock Component
 * Features a simple monospaced styling and line numbers.
 * In the future, this will connect to a highlighter.
 */
export function CodeBlock(props: {
    code: string;
    language?: string;
    style?: ComponentProps;
}): SceneNode {
    const { code, style = {} } = props;
    const lines = code.split("\n");

    return View({
        backgroundColor: "#1e1e1e",
        borderRadius: 8,
        padding: 20,
        flexDirection: "column",
        ...style
    }, lines.map((line, i) =>
        View({ flexDirection: "row", marginBottom: 4 }, [
            // Line Number
            Text((i + 1).toString(), {
                color: "#6b7280",
                fontSize: 16,
                fontFamily: "monospace",
                marginRight: 16,
                width: 30,
                textAlign: "right"
            }),
            // Code Content
            Text(line, {
                color: "#d4d4d8",
                fontSize: 16,
                fontFamily: "monospace"
            })
        ])
    ));
}
