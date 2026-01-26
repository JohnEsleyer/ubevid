# 🟣 Ubevid

**The Visionary Video Orchestration Engine.**

Ubevid (derived from *Ube*—the vibrant purple yam—and *Video*) is a high-performance, deterministic video rendering engine. It replaces the "legacy" era of browser automation (Puppeteer/Chromium) with a **Headless Virtual Engine** built in Rust and TypeScript.

> *"Code like a Web Developer. Render like a Systems Engineer."*

---

## 🚀 The Vision

Traditional automated video tools are heavy, carry the weight of the entire web DOM, and are prone to "non-deterministic" stutters if the CPU spikes. 

**Ubevid is different:**
- **Absolute Determinism:** Every frame is calculated, not "captured."
- **Phase 1 Parallel Power:** Now features a **Multithreaded Render Engine** using Bun Workers to distribute frames across all CPU cores.
- **Zero-Copy Pipeline:** Optimized video ingestion using raw binary frame caching, bypassing slow image decoding.
- **Headless & Native:** Powered by **Bun**, **Rust (Wasm)**, and **TinySkia**. No Chromium required.

---

## ✨ Key Features

### ⚡ Performance (Phase 1 Complete)
- **Threaded Rendering:** Scales automatically to your CPU core count for lightning-fast MP4 exports.
- **Wasm SIMD Acceleration:** Pixel-level operations (filters, blending) are optimized at the instruction level.
- **Aesthetic CLI:** A beautiful, minimal terminal interface with purple progress bars, ETAs, and high-fidelity logging.

### 📐 Modern Layout
- **Flexbox & Grid:** Powered by [Taffy](https://github.com/DioxusLabs/taffy). Build video layouts exactly like you build websites.
- **Intrinsic Text Measurement:** Containers automatically grow and wrap based on your typography.

### 🎨 Professional Graphics
- **Visual FX Pipeline:** 16+ Blend Modes (Screen, Multiply, Overlay, etc.) and real-time filters (Blur, Grayscale, Brightness, Contrast, Saturation, Sepia, Invert).
- **Masking Engine:** Support for Alpha and Luminance masks with layout-aware positioning.
- **SVG Path Engine:** High-performance vector rendering with Path Length Measurement for stroke-draw effects.

### 🎬 Motion & Physics
- **Spring Physics:** Integrated RK4 spring simulation for natural, bouncy UI animations.
- **Lottie Ingestion:** Ingest Bodymovin JSON animations directly into the native scene graph.
- **Temporal Motion Blur:** Cinematic sub-frame accumulation for smooth motion.

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
import { render, useFrame } from "../lib/engine.js";
import path from "path";

const config = { 
  width: 1920, height: 1080, fps: 60, duration: 5 
};

export default function MyVideo() {
  const frame = useFrame();
  
  return {
    tag: "view",
    style: {
      width: 1920, height: 1080,
      backgroundColor: "#111",
      justifyContent: "center", alignItems: "center"
    },
    children: [
      {
        tag: "rect",
        style: {
          width: 400, height: 400,
          backgroundColor: "#8b5cf6",
          rotate: frame * 2,
          borderRadius: 40
        }
      }
    ]
  };
}

// Support parallel rendering by passing the file path
const currentFile = path.resolve(import.meta.path);
if (process.argv.includes("--render")) {
  await render(MyVideo, config, "output.mp4", {}, currentFile);
}
```

### 2. Live Preview
Run the preview server with live-reloading:
```bash
bun --watch sketches/hello.js
```
Navigate to `http://localhost:3000` to scrub the timeline and download test renders.

### 3. Production Render (Parallel)
```bash
bun sketches/hello.js --render
```

---

## 🏗 Project Architecture

- **`/core`**: Rust source code. Handles layout (Taffy), rasterization (TinySkia), and masking.
- **`/lib`**: TypeScript orchestrator. Manages the Worker pool, Wasm bridging, and the FFmpeg pipeline.
- **`/sketches`**: Your creative playground.
- **`/tests`**: Automated unit tests for rendering consistency and masking logic.

---

## 🗺 Roadmap

- [x] **Phase 1: Speed & Infrastructure**
  - Multithreaded rendering (Bun Workers).
  - Raw binary video pipeline.
  - Aesthetic CLI & Modern Wasm Init.
- [ ] **Phase 2: Creative Expressiveness**
  - Custom Shader Nodes (GLSL-like).
  - Kinetic Typography (Text-on-path).
  - Advanced Lottie (Repeaters/Expressions).
- [ ] **Phase 3: Tooling**
  - Live Layout Debugger (Visual Taffy inspector).

---

## ⚖️ License

MIT © 2026 John Esleyer & Ubevid Contributors.