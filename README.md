# 💎 Amethyst

**The High-Performance Native Video Orchestration Engine.**

Amethyst is a deterministic video rendering engine that brings "Chrome's rendering pipeline without the Chrome process overhead" to the terminal. By replacing browser-based automation with a **Native Core**, Amethyst delivers professional cinematic output with the developer experience of the web.

> *"Native speed. Web DX. Absolute precision."*

---

## 🚀 The Native Pivot

Amethyst has evolved. We've moved beyond Wasm-based rendering to a **Pure Native Pipeline**:
- **Skia-Canvas:** Powered by Google's Skia C++ library (the same engine driving Chrome and Android).
- **Yoga Layout:** Powered by Meta's Yoga (the engine behind React Native) for 100% CSS Flexbox fidelity.
- **Bun Runtime:** Leverages Bun's high-speed workers and native I/O for parallel rendering.
- **Direct Pipeline:** Zero-copy binary frames piped directly from Skia to FFmpeg via `stdin`.

---

## ✨ Key Features

### 📐 Professional Layout (Yoga)
- **CSS Flexbox:** Build video layouts with `flexDirection`, `justifyContent`, `alignItems`, and `gap`.
- **Responsive Dimensions:** Support for `percentages`, `auto` sizing, and `aspectRatio`.
- **Absolute Positioning:** Place elements with `top`, `bottom`, `left`, `right`, and `zIndex`.

### 🎨 High-Fidelity Rendering (Skia)
- **Typography:** Native font fallback, kerning, ligatures, and emojis via `FontLibrary`.
- **Visual FX:** Cinematic `blur`, `brightness`, `contrast`, and `grayscale` filters.
- **Masking & Clipping:** Professional `borderRadius` and `overflow: hidden` support.
- **Object Fit:** Native `cover`, `contain`, and `fill` modes for images and video.

### 🎬 Performance & Motion
- **Multi-threaded:** Automatically scales rendering across every CPU core using Bun Workers.
- **Cinematic Motion Blur:** Sub-frame accumulation (e.g., 8x, 16x) for smooth, high-end motion.
- **Deterministic Logic:** Use functional hooks like `useFrame()` and `useKeyframes()` for frame-perfect control.
- **High-Speed Video:** Pre-processed raw RGBA frame ingestion for stutter-free video overlays.

---

## 💻 Developer Experience

Amethyst provides a declarative, functional API that feels like modern web development.

```typescript
import { View, Text, ImageComp, useFrame, useKeyframes, Easing } from "amethyst";

export default function MySketch() {
  const frame = useFrame();
  const opacity = useKeyframes({ 0: 0, 30: 1 });
  const y = useKeyframes({ 0: 100, 60: 0 }, Easing.outBounce);

  return View({
    width: "100%", height: "100%",
    backgroundColor: "#0a0a0c",
    justifyContent: "center", alignItems: "center"
  }, [
    View({
      padding: 40, backgroundColor: "#1a1a1e",
      opacity, top: y
    }, [
      Text("AMETHYST NATIVE", { fontSize: 48, color: "#a855f7" })
    ])
  ]);
}
```

---

## 📦 Installation

### Prerequisites
1. **Bun:** `curl -fsSL https://bun.sh/install | bash`
2. **FFmpeg:** Required for final MP4 encoding.

### Setup
```bash
# Install dependencies
bun install

# Run the demo sketch
bun sketches/run_demo.ts
```

---

## 🗺️ Roadmap
- [x] Native Skia-Canvas Core
- [x] Yoga Flexbox Layout
- [x] Multi-threaded Parallel Pipelines
- [x] Cinematic Motion Blur
- [ ] SVG Path Engine (Native Skia Paths)
- [ ] Lottie Integration (Skia Skottie)
- [ ] Real-time Preview Server (HMR)

---

## 📄 License
MIT © John Esleyer