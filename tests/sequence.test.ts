import { describe, expect, test, beforeEach } from "bun:test";
import { Sequence } from "../lib/sequence.js";
import { useFrame } from "../lib/hooks.js";
import { State } from "../lib/state.js";

describe("Sequence Orchestration", () => {
    beforeEach(() => {
        State.frame = 0;
        State.offset = 0;
    });

    test("Sequence shifts frame offset for children", () => {
        State.frame = 50;
        
        const node = Sequence({
            from: 30,
            children: () => {
                const frame = useFrame();
                return {
                    tag: "text",
                    text: `Frame: ${frame}`,
                    style: {}
                };
            }
        });

        // @ts-ignore
        expect(node.text).toBe("Frame: 20");
    });

    test("Sequence returns empty node when out of range", () => {
        State.frame = 10;
        const node = Sequence({
            from: 30,
            children: () => ({ tag: "rect", style: {} })
        });
        
        expect(node.tag).toBe("view");
        // @ts-ignore
        expect(node.style.width).toBe(0);
    });
});