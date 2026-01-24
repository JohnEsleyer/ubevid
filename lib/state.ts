import { AudioAnalyzer } from "./audio.js";

interface EngineState {
  frame: number;
  offset: number;
  audio: AudioAnalyzer | null;
}

declare global {
  var __UB_STATE: EngineState;
}

globalThis.__UB_STATE = {
  frame: 0,
  offset: 0,
  audio: null,
};

export const State = {
  get frame() { return globalThis.__UB_STATE.frame; },
  set frame(v: number) { globalThis.__UB_STATE.frame = v; },
  get offset() { return globalThis.__UB_STATE.offset; },
  set offset(v: number) { globalThis.__UB_STATE.offset = v; },
  get audio() { return globalThis.__UB_STATE.audio; },
  set audio(v: AudioAnalyzer | null) { globalThis.__UB_STATE.audio = v; }
};
