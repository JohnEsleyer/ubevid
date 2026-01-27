import { State } from "./state.js";
import { interpolate } from "./math.js";
import type { FrequencyBands } from "./audio.js";

export function useFrame(): number {
  return State.frame - State.offset;
}

export function useAudio(fps: number = 30): number {
  return State.audio ? State.audio.getVolume(State.frame, fps) : 0;
}

/**
 * Returns reactive frequency bands (bass, mid, treble)
 */
export function useAudioFrequency(fps: number = 30): FrequencyBands {
    return State.audio 
        ? State.audio.getFrequency(State.frame, fps) 
        : { bass: 0, mid: 0, treble: 0 };
}

export type KeyframeConfig = Record<number, number>;

export function useKeyframes(
  keyframes: KeyframeConfig, 
  easing: (t: number) => number = (t) => t
): number {
  const frame = useFrame();
  const keys = Object.keys(keyframes).map(Number).sort((a, b) => a - b);
  
  if (keys.length === 0) return 0;
  if (frame <= keys[0]) return keyframes[keys[0]];
  if (frame >= keys[keys.length - 1]) return keyframes[keys[keys.length - 1]];

  for (let i = 0; i < keys.length - 1; i++) {
    const start = keys[i];
    const end = keys[i+1];
    if (frame >= start && frame < end) {
      return interpolate(frame, [start, end], [keyframes[start], keyframes[end]], easing);
    }
  }
  return keyframes[keys[keys.length - 1]];
}