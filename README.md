

# 🟣 Ubevid

**The Visionary Video Orchestration Engine.**

Ubevid (derived from *Ube*—the vibrant purple yam—and *Video*) is a high-performance, deterministic video rendering engine. It replaces the "legacy" era of browser automation (Puppeteer/Chromium) with a **Headless Virtual Engine** built in Rust and TypeScript.

> *"Code like a Web Developer. Render like a Systems Engineer."*

---

## 🚀 The Vision

Traditional automated video tools are heavy, carry the weight of the entire web DOM, and are prone to "non-deterministic" stutters if the CPU spikes. 

**Ubevid is different:**
- **Absolute Determinism:** Every frame is calculated, not "captured." Frame 100 will look identical whether rendered on a 2015 laptop or a 2026 server cluster.
- **Headless & Lightweight:** No 1GB Chromium installation. Powered by **Bun**, **Rust**, and **TinySkia**.
- **CPU-First, GPU-Optional:** Designed to run on scalable, cheap cloud infrastructure (Lambda/Edge) without requiring specialized GPU drivers.

---

## ✨ Key Features

### 📐 Modern Layout
- **Flexbox & Grid:** Powered by [Taffy](https://github.com/DioxusLabs/taffy). Build video layouts exactly like you build websites.
- **Intrinsic Text Measurement:** Containers automatically grow and wrap based on your typography.
- **Transform System:** Full support for `Scale`, `Rotate`, `Skew`, and `Anchor Points` for precise coordinate mapping.

### 🎨 Professional Graphics
- **Visual FX Pipeline:** 16+ Blend Modes (Screen, Multiply, Overlay, etc.) and real-time filters (Blur, Grayscale, Brightness, Contrast, Saturation, Sepia, Invert).
- **SVG Path Engine:** High-performance vector rendering with support for absolute and relative paths, including **Path Length Measurement** for stroke-draw effects.
- **Gradients & Shadows:** Linear and radial gradients with sub-pixel shadow rendering.

### 🎬 Motion & Physics
- **Temporal Motion Blur:** Cinematic sub-frame accumulation (configurable samples and shutter angle).
- **Spring Physics:** Integrated RK4 spring simulation for natural, bouncy UI animations.
- **Perlin Noise:** Built-in 3D noise generator for organic textures and movement.
- **Lottie Ingestion:** Basic support for Bodymovin JSON animations directly in the scene graph.

### 🔊 Audio Reactivity
- **Waveform Analysis:** Built-in RMS volume analysis via FFmpeg. Use the `useAudio()` hook to drive visual properties with music frequency.

---

## 📦 Installation

### Prerequisites
1. **Bun:** `curl -fsSL https://bun.sh/install | bash`
2. **FFmpeg:** Required for final MP4 encoding and audio decoding.
3. **Rust:** (Only if modifying the core) `rustup` with `wasm-pack`.

### Setup
```bash
# Install dependencies
bun install

# Build the Wasm core
bun run build:wasm
```

---

## 🛠 Usage

### 1. Create a Sketch
Create a file like `sketches/hello.js`:

```javascript
import { render, useFrame, useAudio } from "../lib/engine.ts";
import { interpolate, Spring } from "../lib/math.ts";

const config = { 
  width: 1280, height: 720, fps: 30, duration: 2,
  audio: "assets/music.mp3" 
};

function MyVideo() {
  const frame = useFrame();
  const volume = useAudio();
  
  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "rect",
        style: {
          width: 200 + (volume * 100),
          height: 200,
          backgroundColor: "#8b5cf6",
          rotate: frame * 2,
          borderRadius: 20
        }
      }
    ]
  };
}

await render(MyVideo, config, "output.mp4");
```

### 2. Live Preview
Run the preview server with live-reloading:
```bash
bun --watch sketches/hello.js
```
Navigate to `http://localhost:3000` to scrub through your timeline and download test renders.

### 3. Production Render
```bash
bun sketches/hello.js --render
```

---

## 🏗 Project Architecture

- **`/core`**: Rust source code. Handles layout (Taffy), rasterization (TinySkia), and post-processing filters.
- **`/lib`**: TypeScript orchestrator. Manages the "Virtual Clock," Audio analysis, Physics simulations, and the FFmpeg pipeline.
- **`/sketches`**: Your creative playground.
- **`/tests`**: Automated unit tests for math, physics, and rendering consistency.

---

## 🗺 Roadmap

- [x] **Phase 1:** Flexbox Layout & Primitives.
- [x] **Phase 2:** Advanced Strokes & SVG Paths.
- [x] **Phase 3:** Post-processing (Blur/Filters/Blend Modes) & Audio Reactivity.
- [x] **Phase 4:** Temporal Motion Blur & Spring Physics.
- [ ] **Phase 5:** Video-in-Video & Advanced Lottie (Bezier/Mattes).
- [ ] **Phase 6:** Multithreaded Rendering & Performance Benchmarking.
- [ ] **Phase 7:** CLI Tooling & Cloud Worker Recipes.

---

## ⚖️ License

MIT © 2026 John Esleyer & Ubevid Contributors.

--------------------------------------------------
git commit message
--------------------------------------------------
docs: update README.md with newly implemented features and roadmap status