export interface GradientConfig {
  colors: string[];
  stops?: number[];
  angle?: number;
}

export interface StyleConfig {
  width?: number;
  height?: number;
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
  
  // Visuals
  backgroundColor?: string;
  backgroundGradient?: GradientConfig;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  overflow?: "visible" | "hidden"; // New
  grayscale?: number;               // New (0 to 1)
  
  // Text
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  
  // Transforms
  rotate?: number;
  scale?: number;
}

export interface SceneNode {
  tag: "view" | "text" | "image" | "circle" | "rect";
  text?: string;
  src?: string;
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