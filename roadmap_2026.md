# Amethyst Roadmap 2026: The "Code-First" Content Engine

> **Goal:** Transform Amethyst from a "render engine" into a comprehensive "Content Creation Toolkit" for developers. We will focus on high-utility features that creators need: **Text**, **Data**, and **Video Processing**, skipping the complexity of vector animation importing (Lottie).

---

## 🏗️ Phase 3: The "Amethyst Standard Library" (stdlib)
**Goal:** A rich set of built-in components that solve 80% of common video tasks.

### 1. Kinetic Typography Engine
Text is the most important element of modern social video. Skia gives us raw power; we need to wrap it.
- **Components:**
  - `<Typewriter />`: Standard character-by-character reveal (with cursor).
  - `<TextFit />`: Auto-shrink text to fit container (like meme generators).
  - `<CodeBlock />`: Syntax highlighting for developer tutorials (using Shiki/Prism logic).
  - `<KineticText />`: Per-character transforms (wavy text, shake, explode).

### 2. Data Visualization (The "Nivo" for Video)
Native charting primitives drawn directly with Skia Paths.
- **Components:**
  - `<LineChart />`: Animated stroke drawing with smooth interpolations.
  - `<BarChart />`: Dynamic height/width animations.
  - `<PieChart />`: Radial sector animations.
  - **Features:** Auto-axis generation, legends, and color themes.

---

## 🎨 Phase 4: Visual FX & Compositing
**Goal:** Replace simple "filters" with a true node-based compositing philosophy.

### 1. Advanced Filters (Shaders)
- **Skia Shaders (SkSL):** Allow users to write custom GLSL-like shaders for backgrounds (noise, grain, gradients).
- **LUT Support:** Import `.cube` files for cinematic color grading.
- **Chroma Key:** Remove green screens from video inputs.

### 2. Transitions
- **Pre-built Transitions:** `CrossFade`, `SlideOver`, `Wipe`, `CircleReveal`.
- **Masking:** Advanced `maskMode` support (Luminance, Alpha) for "Track Matte" effects.

---

## ⚡ Phase 5: Developer Experience (DX)
**Goal:** Make the feedback loop instant.

### 1. The "Live" Dev Server
- **HMR (Hot Module Replacement):** Update the sketch code and see the frame refresh instantly without restarting the process.
- **Scrubber UI:** A lightweight web UI (served by Bun) to scrub through the timeline, inspect variables, and play/pause.

### 2. CLI Improvements
- **`amethyst create`:** Scaffolding tool for new projects.
- **`amethyst preview`:** Launch the dev server.

---

## 🚫 Deprecated / Skipped
- **Lottie:** We are explicitly NOT pursuing Lottie integration. Vector animation can be handled via code (SVG Paths) or imported as transparent video sequences if absolutely needed.

---

## 📅 Timeline

| Phase   | Feature Set                 | ETA     |
| ------- | --------------------------- | ------- |
| **3.0** | Kinetic Typography & Charts | Q2 2026 |
| **4.0** | Shaders & Video FX          | Q3 2026 |
| **5.0** | Live Dev Server (HMR)       | Q4 2026 |
