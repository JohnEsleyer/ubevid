# 💎 Amethyst

**The High-Performance Native Video Orchestration Engine.**

Amethyst is a deterministic video rendering engine that brings "Chrome's rendering pipeline without the browser overhead" to the terminal. By replacing browser-based automation with a **Native Core**, Amethyst delivers professional cinematic output with the developer experience of modern web frameworks.

> *"Native speed. Web DX. Absolute precision."*

---

## 🚀 Native Architecture

Amethyst is built for extreme performance and frame-perfect determinism:
- **Skia-Canvas:** Powered by Google's Skia C++ library for high-speed, high-fidelity 2D graphics.
- **Yoga Layout:** Uses Meta's Yoga engine for 100% CSS Flexbox fidelity in video layouts.
- **Bun Runtime:** Leverages Bun's native I/O and parallel worker threads for distributed rendering.
- **Direct Pipeline:** Piped raw binary RGBA frames directly to FFmpeg via `stdin` for zero-copy encoding.

---

## ✨ Core Features

### 📐 Professional Layout
- **CSS Flexbox:** Full support for `flexDirection`, `justifyContent`, `alignContent`, and `gap`.
- **Absolute Precision:** Layer elements with `zIndex`, `opacity`, and relative/absolute positioning.
- **Masking & Clipping:** Integrated Support for `overflow: hidden`, `borderRadius`, and complex `mask` hierarchies.

### 🎨 Advanced Rendering
- **SVG Paths:** Native support for Skia `Path2D` for vector shapes and complex charting.
- **Filters & VFX:** Real-time `blur`, `brightness`, `contrast`, `grayscale`, `sepia`, and `invert`.
- **Blend Modes:** Professional compositing with `Multiply`, `Screen`, `Overlay`, and 16+ other modes.
- **Transforms:** Native `rotate`, `scale`, `skewX`, and `skewY` transformations.

### 🎬 Professional Motion
- **Deterministic Logic:** Frame-perfect control via functional hooks like `useFrame()`.
- **Keyframe Engine:** Simple object-based animation with built-in easings (`outBounce`, `outElastic`, etc.).
- **Cinematic Motion Blur:** Sub-frame accumulation for high-end, smooth organic motion.
- **Multi-threaded Rendering:** Automatic scaling across all CPU cores via worker pools.

---

## 📦 Standard Library (stdlib)

Amethyst comes with a rich set of built-in components to accelerate your workflow:

### 🖋️ Kinetic Typography
- `<Typewriter />`: Character-by-character reveals with animated cursors.
- `<KineticText />`: Per-character transformations for "wavy" or "exploding" text effects.
- `<CodeBlock />`: Syntax-highlighted code visualization for developer tutorials.

### 📊 Data Visualization
- `<BarChart />`: Animated vertical bars with custom styling and data mapping.
- `<LineChart />`: Dynamic SVG-path based line graphs with reveal animations.

### 🎞️ Transitions & FX
- **Transitions:** Smooth `crossFade` and `slide` (Left, Right, Top, Bottom) transitions.
- **Visual Presets:** One-tap professional looks like `Effects.cinematic`, `Effects.noir`, and `Effects.vintage`.

---

## 💻 Usage

Amethyst uses a declarative, functional API that feels like writing modern React components.

```typescript
import { View, Text, BarChart, useKeyframes, Easing, Effects } from "amethyst";

export default function MyDemo() {
  const progress = useKeyframes({ 0: 0, 60: 1 }, Easing.outElastic);

  const data = [
    { label: "Rust", value: 90, color: "#dea584" },
    { label: "Bun", value: 95, color: "#fbf0df" },
    { label: "Skia", value: 85, color: "#2f5d02" }
  ];

  return View({
    width: "100%", height: "100%",
    backgroundColor: "#030712",
    justifyContent: "center", alignItems: "center",
    ...Effects.cinematic // Apply professional color grade
  }, [
    Text("Performance Benchmarks", { 
        fontSize: 48, fontWeight: "bold", 
        color: "#fff", marginBottom: 40 
    }),

    BarChart({
      data,
      width: 800, height: 400,
      maxValue: 100,
      progress, // Animate the entire chart
      barStyle: { borderRadius: 8 }
    })
  ]);
}
```

---

## 🛠️ Getting Started

### Prerequisites
- **Bun:** `curl -fsSL https://bun.sh/install | bash`
- **FFmpeg:** Required for video encoding.

### Setup
```bash
# Clone and install
git clone https://github.com/JohnEsleyer/amethyst.git
cd amethyst
bun install

# Run a verification sketch
bun sketches/run_masking_vfx.ts
```

---

## 📄 License

MIT © John Esleyer