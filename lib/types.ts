export interface GradientConfig {
  type?: "linear" | "radial";
  colors: string[];
  stops?: number[];
  angle?: number;
}

export interface StyleConfig {
  width?: number;
  height?: number;
  aspectRatio?: number;
  flex?: number;
  flexDirection?: "row" | "column";
  justifyContent?: "center" | "spaceBetween" | "flexStart" | "flexEnd";
  alignItems?: "center" | "flexStart" | "flexEnd";
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  padding?: number;
  
  position?: "relative" | "absolute";
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
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

  // Filters
  grayscale?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  
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
}

export interface SceneNode {
  tag: "view" | "text" | "image" | "circle" | "rect" | "path";
  text?: string;
  src?: string;
  d?: string;
  style: StyleConfig;
  children?: SceneNode[];
}

export interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  assets?: Record<string, string>;
  fonts?: Record<string, string>;
  audio?: string;
}