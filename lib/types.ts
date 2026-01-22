export interface StyleConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
  color?: string; // Text color
  fontSize?: number;
  margin?: number;
  padding?: number;
  flex?: number;
  flexDirection?: "row" | "column";
  justifyContent?: "center" | "spaceBetween" | "flexStart" | "flexEnd";
  alignItems?: "center" | "flexStart" | "flexEnd";
  opacity?: number;
  rotate?: number;
  scale?: number;
  
}

export interface SceneNode {
  tag: "view" | "rect" | "text" | "image";
  text?: string;
  src?: string; // For images
  style: StyleConfig;
  children?: SceneNode[];
}

export interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  assets?: Record<string, string>;
  audio?: string;
}