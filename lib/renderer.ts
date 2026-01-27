import { Canvas, Image, loadImage, FontLibrary, Path2D } from "skia-canvas";
import { calculateLayout } from "./layout.js";
import type { SceneNode, RenderConfig } from "./types.js";
import { State } from "./state.js";
import { VideoManager } from "./video.js";

const imageCache = new Map<string, Image>();
const videoManager = new VideoManager();

/**
 * Internal function to render a single sub-frame.
 */
async function _renderRawFrame(
  sceneComponent: (props: any) => SceneNode,
  config: RenderConfig,
  frame: number
): Promise<Uint8Array> {
  State.frame = frame;
  State.offset = 0;

  const canvas = new Canvas(config.width, config.height);
  const ctx = canvas.getContext("2d");
  const scene = sceneComponent({ frame });

  // Register Fonts if provided
  if (config.fonts) {
    for (const [family, path] of Object.entries(config.fonts)) {
      FontLibrary.use(family, path);
    }
  }

  // 1. Compute Flexbox Layout via Yoga
  const layoutRoot = calculateLayout(scene, config.width, config.height);

  // 2. Recursive Draw Function
  async function drawNode(node: SceneNode, yogaNode: any) {
    const layout = yogaNode.getComputedLayout();
    ctx.save();

    // Opacity
    if (node.style.opacity !== undefined) ctx.globalAlpha *= node.style.opacity;

    // Position the context
    ctx.translate(layout.left, layout.top);

    // Apply Native Skia Filters (Blur, Brightness, etc)
    const filters: string[] = [];
    if (node.style.blur) filters.push(`blur(${node.style.blur}px)`);
    if (node.style.brightness !== undefined) filters.push(`brightness(${node.style.brightness})`);
    if (node.style.contrast !== undefined) filters.push(`contrast(${node.style.contrast})`);
    if (node.style.grayscale !== undefined) filters.push(`grayscale(${node.style.grayscale})`);
    if (filters.length > 0) ctx.filter = filters.join(" ");

    // Clip/Overflow
    if (node.style.overflow === "hidden") {
      ctx.beginPath();
      if (node.style.borderRadius) {
        ctx.roundRect(0, 0, layout.width, layout.height, node.style.borderRadius);
      } else {
        ctx.rect(0, 0, layout.width, layout.height);
      }
      ctx.clip();
    }

    // Draw Background
    if (node.style.backgroundColor) {
      ctx.fillStyle = node.style.backgroundColor;
      if (node.style.borderRadius) {
        ctx.beginPath();
        ctx.roundRect(0, 0, layout.width, layout.height, node.style.borderRadius);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, layout.width, layout.height);
      }
    }

    // Draw Border
    if (node.style.borderColor && node.style.borderWidth) {
      ctx.strokeStyle = node.style.borderColor;
      ctx.lineWidth = node.style.borderWidth;
      if (node.style.borderRadius) {
        ctx.beginPath();
        ctx.roundRect(0, 0, layout.width, layout.height, node.style.borderRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(0, 0, layout.width, layout.height);
      }
    }

    // Draw Content based on tag
    if (node.tag === "text" && node.text) {
      ctx.fillStyle = node.style.color || "#ffffff";
      const fontSize = node.style.fontSize || 30;
      const fontFamily = node.style.fontFamily || "sans-serif";
      const fontWeight = node.style.fontWeight || "";
      ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`.trim();

      const textMetrics = ctx.measureText(node.text);
      let tx = 0;
      if (node.style.textAlign === "center") tx = (layout.width - textMetrics.width) / 2;
      else if (node.style.textAlign === "right") tx = layout.width - textMetrics.width;

      ctx.fillText(node.text, tx, fontSize);
    } else if (node.tag === "image" && node.src) {
      let img = imageCache.get(node.src);
      if (!img) {
        try {
          img = await loadImage(node.src);
          imageCache.set(node.src, img);
        } catch (e) {
          console.error(`Failed to load image: ${node.src}`, e);
        }
      }
      if (img) {
        const objectFit = node.style.objectFit || "fill";
        if (objectFit === "fill") {
          ctx.drawImage(img, 0, 0, layout.width, layout.height);
        } else if (objectFit === "contain" || objectFit === "cover") {
          const imgRatio = img.width / img.height;
          const containerRatio = layout.width / layout.height;
          let dw, dh, dx, dy;
          if (objectFit === "contain") {
            if (imgRatio > containerRatio) {
              dw = layout.width;
              dh = dw / imgRatio;
            } else {
              dh = layout.height;
              dw = dh * imgRatio;
            }
          } else { // cover
            if (imgRatio > containerRatio) {
              dh = layout.height;
              dw = dh * imgRatio;
            } else {
              dw = layout.width;
              dh = dw / imgRatio;
            }
          }
          dx = (layout.width - dw) / 2;
          dy = (layout.height - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
        }
      }
    } else if (node.tag === "video" && node.src) {
      const videoFrame = await videoManager.getFrame(node.src, Math.floor(frame));
      if (videoFrame) {
        // Draw raw RGBA pixels to offscreen canvas, then draw that to main context to respect transforms
        const offscreen = new Canvas(config.width, config.height);
        const offCtx = offscreen.getContext("2d");
        const imgData = offCtx.createImageData(config.width, config.height);
        imgData.data.set(videoFrame);
        offCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(offscreen, 0, 0, layout.width, layout.height);
      }
    } else if (node.tag === "path" && node.d) {
      const p = new Path2D(node.d);

      if (node.style.fill) {
        ctx.fillStyle = node.style.fill;
        ctx.fill(p);
      }

      if (node.style.stroke) {
        ctx.strokeStyle = node.style.stroke;
        ctx.lineWidth = node.style.strokeWidth || 1;

        if (node.style.strokeLineCap) ctx.lineCap = node.style.strokeLineCap;
        if (node.style.strokeLineJoin) ctx.lineJoin = node.style.strokeLineJoin;
        if (node.style.strokeDashArray) ctx.setLineDash(node.style.strokeDashArray);
        if (node.style.strokeDashOffset) ctx.lineDashOffset = node.style.strokeDashOffset;

        ctx.stroke(p);
      }
    }

    // Process Children
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        await drawNode(node.children[i], yogaNode.getChild(i));
      }
    }

    ctx.restore();
  }

  await drawNode(scene, layoutRoot);
  return canvas.toBuffer("raw");
}

/**
 * Public API to render a frame, with optional sub-frame motion blur.
 */
export async function renderSingleFrame(
  sceneComponent: (props: any) => SceneNode,
  config: RenderConfig,
  frame: number
): Promise<Uint8Array> {
  const samples = config.motionBlurSamples || 1;
  if (samples <= 1) {
    return _renderRawFrame(sceneComponent, config, frame);
  }

  const shutterAngle = config.shutterAngle || 180;
  const exposureDuration = shutterAngle / 360;
  const timeStep = exposureDuration / samples;
  const bufferSize = config.width * config.height * 4;
  const accumulation = new Float32Array(bufferSize);

  for (let i = 0; i < samples; i++) {
    const t = frame + (i * timeStep);
    const subBuffer = await _renderRawFrame(sceneComponent, config, t);
    for (let j = 0; j < subBuffer.length; j++) {
      accumulation[j] += subBuffer[j];
    }
  }

  const result = new Uint8Array(bufferSize);
  for (let i = 0; i < accumulation.length; i++) {
    result[i] = Math.round(accumulation[i] / samples);
  }
  return result;
}