import { State } from "./state.js";
import { interpolate } from "./math.js";

/**
 * Returns the current frame number relative to the current Sequence offset.
 */
export function useFrame(): number {
  return State.frame - State.offset;
}

/**
 * Returns the audio volume (0.0 - 1.0) for the current frame.
 */
export function useAudio(fps: number = 30): number {
  return State.audio ? State.audio.getVolume(State.frame, fps) : 0;
}

export type KeyframeConfig = Record<number, number>;

/**
 * Interpolates a value based on a keyframe object.
 * Example: useKeyframes({ 0: 0, 30: 100, 60: 0 })
 */
export function useKeyframes(
  keyframes: KeyframeConfig, 
  easing: (t: number) => number = (t) => t
): number {
  const frame = useFrame();
  const keys = Object.keys(keyframes).map(Number).sort((a, b) => a - b);
  
  if (keys.length === 0) return 0;
  if (frame <= keys[0]) return keyframes[keys[0]];
  if (frame >= keys[keys.length - 1]) return keyframes[keys[keys.length - 1]];

  // Find the segment [start, end]
  for (let i = 0; i < keys.length - 1; i++) {
    const start = keys[i];
    const end = keys[i+1];
    
    if (frame >= start && frame < end) {
      return interpolate(
        frame, 
        [start, end], 
        [keyframes[start], keyframes[end]], 
        easing
      );
    }
  }

  return keyframes[keys[keys.length - 1]];
}