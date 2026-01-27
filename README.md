# 💎 Amethyst

**The Crystal-Clear Video Orchestration Engine.**

Amethyst is a high-performance, deterministic video rendering engine. It replaces the legacy era of browser-based automation (Chromium/Puppeteer) with a **Headless Native Engine** built in Rust and TypeScript.

> *"Render with clarity. Build with precision."*

---

## 🚀 The Vision

Traditional automated video tools are heavy, carry the weight of a full web browser, and are prone to non-deterministic stutters.

**Amethyst is different:**
- **Native Precision:** Built on Rust (Wasm) and TinySkia. No Chromium required.
- **Multithreaded Power:** Bun Workers distribute frame rendering across every CPU core.
- **Absolute Determinism:** Every frame is calculated, not "captured."
- **Zero-Copy Pipeline:** Optimized video ingestion using raw binary frame caching, bypassing slow image decoding.

---

## ✨ Key Features

### ⚡ Performance
- **Threaded Rendering:** Scales automatically to your CPU core count for lightning-fast exports.
- **Wasm SIMD Acceleration:** Pixel-level operations (filters, blending) are optimized at the instruction level.
- **Aesthetic CLI:** A beautiful terminal interface with crystalline progress bars and high-fidelity logging.

### 📐 Modern Layout
- **Flexbox Mastery:** Powered by [Taffy](https://github.com/DioxusLabs/taffy). Build video layouts exactly like you build websites using standard CSS logic.
- **Intrinsic Text Measurement:** Containers automatically grow and wrap based on your typography.

### 🎨 Professional Graphics
- **Visual FX Pipeline:** 16+ Blend Modes and real-time filters (Blur, Grayscale, Brightness, Contrast, Saturation, Sepia, Invert).
- **Masking Engine:** Support for Alpha and Luminance masks with layout-aware positioning.
- **SVG Path Engine:** High-performance vector rendering with Path Length Measurement for stroke-draw effects.

### 🎬 Motion & Physics
- **Spring Physics:** Integrated RK4 spring simulation for natural UI animations.
- **Lottie Ingestion:** Ingest Bodymovin JSON animations directly into the native scene graph.
- **Temporal Motion Blur:** Cinematic sub-frame accumulation for smooth motion.

---

## 📦 Installation

### Prerequisites
1. **Bun:** `curl -fsSL https://bun.sh/install | bash`
2. **FFmpeg:** Required for final MP4 encoding.
3. **Rust:** (If modifying the core) `wasm-pack`.

### Setup
```bash
# Install dependencies
bun install

# Build the Wasm core
bun run build:wasm