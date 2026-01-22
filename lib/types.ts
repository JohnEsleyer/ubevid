export interface StyleConfig {
  // Layout
  width?: number;
  height?: number;
  flex?: number;
  flexDirection?: "row" | "column";
  justifyContent?: "center" | "spaceBetween" | "flexStart" | "flexEnd";
  alignItems?: "center" | "flexStart" | "flexEnd";
  margin?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  padding?: number;
  
  // Positioning
  position?: "relative" | "absolute";
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  
  // Visuals
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  rotate?: number;
  scale?: number;
  
  // Text
  color?: string;
  fontSize?: number;
  fontFamily?: string; // Links to keys in RenderConfig.fonts
}

export interface SceneNode {
  tag: "view" | "text" | "image" | "circle" | "rect";
  text?: string;
  src?: string; // For images, links to keys in RenderConfig.assets
  style: StyleConfig;
  children?: SceneNode[];
}

export interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  assets?: Record<string, string>; // { "logo": "assets/logo.png" }
  fonts?: Record<string, string>;  // { "Main": "assets/Roboto-Regular.ttf" }
  audio?: string;                  // Path to mp3/wav
}