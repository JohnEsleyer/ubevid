export interface StyleConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
  margin?: number;
  padding?: number;
  flex?: number;
}

export interface SceneNode {
  tag: "view" | "rect" | "text";
  style: StyleConfig;
  children?: SceneNode[];
}

export interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
}