export interface GradientConfig {
  type?: "linear" | "radial";
  colors: string[];
  stops?: number[];
  angle?: number;
}

/**
 * Dimensions can be a number (pixels/points) or a string (e.g., "100%", "50%").
 */
export type FlexDimension = number | string;

export interface StyleConfig {
  // Layout
  width?: FlexDimension;
  height?: FlexDimension;
  aspectRatio?: number;
  flex?: number;
  flexDirection?: "row" | "column";
  justifyContent?: "center" | "spaceBetween" | "flexStart" | "flexEnd";
  alignItems?: "center" | "flexStart" | "flexEnd";
  margin?: FlexDimension;
  marginTop?: FlexDimension;
  marginBottom?: FlexDimension;
  marginLeft?: FlexDimension;
  marginRight?: FlexDimension;
  padding?: FlexDimension;
  
  position?: "relative" | "absolute";
  top?: FlexDimension;
  left?: FlexDimension;
  right?: FlexDimension;
  bottom?: FlexDimension;
  zIndex?: number;
  
  // Visuals
  backgroundColor?: string;
  backgroundGradient?: GradientConfig;
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  overflow?: "visible" | "hidden";
  
  blendMode?: "sourceOver" | "screen" | "multiply" | "overlay" | "darken" | "lighten" | 
              "colorDodge" | "colorBurn" | "hardLight" | "softLight" | "difference" | "exclusion" | 
              "hue" | "saturation" | "color" | "luminosity" | "plus" | "xor";

  maskMode?: "alpha" | "alphaInverted" | "luminance" | "luminanceInverted";

  // Strokes
  strokeLineCap?: "butt" | "round" | "square";
  strokeLineJoin?: "miter" | "round" | "bevel";
  strokeDashArray?: number[];
  strokeDashOffset?: number;

  // Filters
  grayscale?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  invert?: number;
  sepia?: number;
  
  // Shadows
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // Text
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;

  // Image
  objectFit?: "fill" | "cover" | "contain";

  // Transforms
  rotate?: number;
  scale?: number;
  skewX?: number;
  skewY?: number;
}

export interface SceneNode {
  tag: "view" | "text" | "image" | "circle" | "rect" | "path" | "ellipse";
  text?: string;
  src?: string;
  d?: string;
  style: StyleConfig;
  children?: SceneNode[];
  mask?: SceneNode; 
}

export interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  assets?: Record<string, string>;
  videos?: Record<string, string>;
  fonts?: Record<string, string>;
  audio?: string;
  
  motionBlurSamples?: number;
  shutterAngle?: number;
}