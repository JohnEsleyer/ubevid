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

### 🎨 Professional Graphics
- **SVG Path Engine:** High-performance vector rendering with support for absolute and relative paths.
- **Glassmorphism & Filters:** Real-time Gaussian blur, brightness, contrast, saturation, and grayscale.
- **Gradients & Shadows:** Linear and radial gradients with sub-pixel shadow rendering.

### 🎬 Motion & Time
- **Temporal Motion Blur:** Cinematic sub-frame accumulation (configurable samples and shutter angle).
- **Audio Reactivity:** Built-in RMS waveform analysis. Use the `useAudio()` hook to drive visuals with music.
- **Bilingual DX:** Write creative "Sketches" in JavaScript for fast iteration; rely on a strict TypeScript engine for production.

---

## 📦 Installation

### Prerequisites
1. **Bun:** `curl -fsSL https://bun.sh/install | bash`
2. **FFmpeg:** Required for final MP4 encoding.
3. **Rust:** (Only if modifying the core) `rustup` with `wasm-pack`.

### Setup
```bash
# Install dependencies
bun install

# Build the Wasm core (if developing)
bun run build:wasm
```

---

## 🛠 Usage

### 1. Create a Sketch
Create a file like `sketches/hello.js`:

```javascript
import { render, useFrame } from "../lib/engine.ts";
import { interpolate, Easing } from "../lib/math.ts";

const config = { width: 1280, height: 720, fps: 30, duration: 2 };

function MyVideo() {
  const frame = useFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], Easing.inOutQuad);

  return {
    tag: "view",
    style: {
      width: 1280, height: 720,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "text",
        text: "HELLO UBEVID",
        style: { color: "#8b5cf6", fontSize: 80, opacity }
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

- **`/core`**: Rust source code. Handles layout, rasterization, and post-processing filters.
- **`/lib`**: TypeScript orchestrator. Manages the "Virtual Clock," Audio analysis, and the FFmpeg pipeline.
- **`/sketches`**: Your creative playground.
- **`/tests`**: Automated unit and integration tests for math and rendering consistency.

---

## 🗺 Roadmap

- [x] **Phase 1:** Flexbox Layout & Primitives.
- [x] **Phase 2:** Advanced Strokes & SVG Paths.
- [x] **Phase 3:** Post-processing (Blur/Filters) & Audio Reactivity.
- [x] **Phase 4:** Temporal Motion Blur & Text Measurement.
- [ ] **Phase 5:** Glyph Caching (Performance) & Inline Text Styling.
- [ ] **Phase 6:** Lottie/BodyMovin Ingestion.

---

## ⚖️ License

MIT © 2026 John Esleyer & Ubevid Contributors.