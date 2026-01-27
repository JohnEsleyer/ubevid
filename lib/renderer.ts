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
  async function drawNode(node: SceneNode, yogaNode: any, targetCtx: any) {
    const layout = yogaNode.getComputedLayout();
    targetCtx.save();

    // Opacity
    if (node.style.opacity !== undefined) targetCtx.globalAlpha *= node.style.opacity;

    // Position the context
    targetCtx.translate(layout.left, layout.top);

    // Apply Transforms (Pivot centered by default)
    if (node.style.rotate || node.style.scale !== undefined || node.style.skewX || node.style.skewY) {
      targetCtx.translate(layout.width / 2, layout.height / 2);
      if (node.style.rotate) targetCtx.rotate((node.style.rotate * Math.PI) / 180);
      if (node.style.scale !== undefined) targetCtx.scale(node.style.scale, node.style.scale);
      if (node.style.skewX) targetCtx.transform(1, 0, Math.tan((node.style.skewX * Math.PI) / 180), 1, 0, 0);
      if (node.style.skewY) targetCtx.transform(1, Math.tan((node.style.skewY * Math.PI) / 180), 0, 1, 0, 0);
      targetCtx.translate(-layout.width / 2, -layout.height / 2);
    }

    // Blend Mode
    if (node.style.blendMode) {
      const modeMap: Record<string, GlobalCompositeOperation> = {
        sourceOver: "source-over",
        screen: "screen",
        multiply: "multiply",
        overlay: "overlay",
        darken: "darken",
        lighten: "lighten",
        colorDodge: "color-dodge",
        colorBurn: "color-burn",
        hardLight: "hard-light",
        softLight: "soft-light",
        difference: "difference",
        exclusion: "exclusion",
        hue: "hue",
        saturation: "saturation",
        color: "color",
        luminosity: "luminosity",
        plus: "lighter",
        xor: "xor",
      };
      const gco = modeMap[node.style.blendMode];
      if (gco) targetCtx.globalCompositeOperation = gco;
    }

    // Apply Native Skia Filters (Blur, Brightness, etc)
    const filters: string[] = [];
    if (node.style.blur) filters.push(`blur(${node.style.blur}px)`);
    if (node.style.brightness !== undefined) filters.push(`brightness(${node.style.brightness})`);
    if (node.style.contrast !== undefined) filters.push(`contrast(${node.style.contrast})`);
    if (node.style.grayscale !== undefined) filters.push(`grayscale(${node.style.grayscale})`);
    if (node.style.saturation !== undefined) filters.push(`saturate(${node.style.saturation})`);
    if (node.style.invert !== undefined) filters.push(`invert(${node.style.invert})`);
    if (node.style.sepia !== undefined) filters.push(`sepia(${node.style.sepia})`);
    if (filters.length > 0) targetCtx.filter = filters.join(" ");

    // Handle Masking (Create offscreen if mask exists)
    let currentCtx = targetCtx;
    let offscreen: any = null;

    if (node.mask) {
      offscreen = new Canvas(layout.width, layout.height);
      currentCtx = offscreen.getContext("2d");
    }

    // --- DRAWING TO currentCtx ---

    // Clip/Overflow
    if (node.style.overflow === "hidden") {
      currentCtx.beginPath();
      if (node.style.borderRadius) {
        currentCtx.roundRect(0, 0, layout.width, layout.height, node.style.borderRadius);
      } else {
        currentCtx.rect(0, 0, layout.width, layout.height);
      }
      currentCtx.clip();
    }

    // Draw Background
    if (node.style.backgroundColor) {
      currentCtx.fillStyle = node.style.backgroundColor;
      if (node.style.borderRadius) {
        currentCtx.beginPath();
        currentCtx.roundRect(0, 0, layout.width, layout.height, node.style.borderRadius);
        currentCtx.fill();
      } else {
        currentCtx.fillRect(0, 0, layout.width, layout.height);
      }
    }

    // Draw Border
    if (node.style.borderColor && node.style.borderWidth) {
      currentCtx.strokeStyle = node.style.borderColor;
      currentCtx.lineWidth = node.style.borderWidth;
      if (node.style.borderRadius) {
        currentCtx.beginPath();
        currentCtx.roundRect(0, 0, layout.width, layout.height, node.style.borderRadius);
        currentCtx.stroke();
      } else {
        currentCtx.strokeRect(0, 0, layout.width, layout.height);
      }
    }

    // Draw Content based on tag
    if (node.tag === "text" && node.text) {
      currentCtx.fillStyle = node.style.color || "#ffffff";
      const fontSize = node.style.fontSize || 30;
      const fontFamily = node.style.fontFamily || "sans-serif";
      const fontWeight = node.style.fontWeight || "";
      currentCtx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`.trim();

      const textMetrics = currentCtx.measureText(node.text);
      let tx = 0;
      if (node.style.textAlign === "center") tx = (layout.width - textMetrics.width) / 2;
      else if (node.style.textAlign === "right") tx = layout.width - textMetrics.width;

      currentCtx.fillText(node.text, tx, fontSize);
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
          currentCtx.drawImage(img, 0, 0, layout.width, layout.height);
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
          currentCtx.drawImage(img, dx, dy, dw, dh);
        }
      }
    } else if (node.tag === "video" && node.src) {
      const videoFrame = await videoManager.getFrame(node.src, Math.floor(frame));
      if (videoFrame) {
        const offscreenV = new Canvas(config.width, config.height);
        const offCtxV = offscreenV.getContext("2d");
        const imgData = offCtxV.createImageData(config.width, config.height);
        imgData.data.set(videoFrame);
        offCtxV.putImageData(imgData, 0, 0);
        currentCtx.drawImage(offscreenV, 0, 0, layout.width, layout.height);
      }
    } else if (node.tag === "path" && node.d) {
      const p = new Path2D(node.d);
      if (node.style.fill) {
        currentCtx.fillStyle = node.style.fill;
        currentCtx.fill(p);
      }
      if (node.style.stroke) {
        currentCtx.strokeStyle = node.style.stroke;
        currentCtx.lineWidth = node.style.strokeWidth || 1;
        if (node.style.strokeLineCap) currentCtx.lineCap = node.style.strokeLineCap;
        if (node.style.strokeLineJoin) currentCtx.lineJoin = node.style.strokeLineJoin;
        if (node.style.strokeDashArray) currentCtx.setLineDash(node.style.strokeDashArray);
        if (node.style.strokeDashOffset) currentCtx.lineDashOffset = node.style.strokeDashOffset;
        currentCtx.stroke(p);
      }
    }

    // Process Children (sorted by zIndex)
    if (node.children) {
      const indexedChildren = node.children.map((child, i) => ({ child, originalIndex: i }));
      const sortedChildren = indexedChildren.sort((a, b) => {
        const zA = a.child.style.zIndex || 0;
        const zB = b.child.style.zIndex || 0;
        return zA - zB;
      });

      for (const { child, originalIndex } of sortedChildren) {
        await drawNode(child, yogaNode.getChild(originalIndex), currentCtx);
      }
    }

    // Finish Masking
    if (node.mask && offscreen) {
      const maskCanvas = new Canvas(layout.width, layout.height);
      const maskCtx = maskCanvas.getContext("2d");
      const maskLayoutRoot = calculateLayout(node.mask, layout.width, layout.height);
      await drawNode(node.mask, maskLayoutRoot, maskCtx);

      const maskMode = node.style.maskMode || "alpha";
      if (maskMode === "alpha" || maskMode === "alphaInverted") {
        currentCtx.globalCompositeOperation = maskMode === "alpha" ? "destination-in" : "destination-out";
        currentCtx.drawImage(maskCanvas, 0, 0);
      } else if (maskMode === "luminance" || maskMode === "luminanceInverted") {
        currentCtx.globalCompositeOperation = "destination-in";
        currentCtx.drawImage(maskCanvas, 0, 0);
      }

      targetCtx.drawImage(offscreen, 0, 0);
    }

    targetCtx.restore();
  }

  await drawNode(scene, layoutRoot, ctx);
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