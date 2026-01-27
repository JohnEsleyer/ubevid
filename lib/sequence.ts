import { State } from "./state.js";
import type { SceneNode } from "./types.js";

export interface SequenceProps {
    from: number;
    duration?: number;
    children: () => SceneNode | SceneNode[];
}

/**
 * Sequence manages the temporal offset of its children.
 * It shifts the value returned by useFrame().
 */
export function Sequence({ from, duration, children }: SequenceProps): SceneNode {
    const currentFrame = State.frame;
    
    // Skip rendering if we haven't reached the start point
    if (currentFrame < from) {
        return { tag: "view", style: { width: 0, height: 0 } };
    }

    // Skip rendering if we are past the duration
    if (duration !== undefined && currentFrame >= from + duration) {
        return { tag: "view", style: { width: 0, height: 0 } };
    }

    const oldOffset = State.offset;
    State.offset = from;
    
    const result = children();
    
    State.offset = oldOffset;

    // If children returned an array, wrap it in a fragment-like view
    if (Array.isArray(result)) {
        return {
            tag: "view",
            style: { width: "100%", height: "100%", position: "absolute" },
            children: result
        };
    }

    return result;
}
