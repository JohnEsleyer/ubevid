import type { SceneNode, StyleConfig, GradientConfig } from "./types.js";

/**
 * High-level component API for building scene graphs.
 */
export const Amethyst = {
    view: (style: StyleConfig, children?: SceneNode[]): SceneNode => ({
        tag: "view",
        style,
        children
    }),

    text: (text: string, style: StyleConfig): SceneNode => ({
        tag: "text",
        text,
        style
    }),

    image: (src: string, style: StyleConfig): SceneNode => ({
        tag: "image",
        src,
        style
    }),

    circle: (style: StyleConfig): SceneNode => ({
        tag: "circle",
        style
    }),

    rect: (style: StyleConfig): SceneNode => ({
        tag: "rect",
        style
    }),

    path: (d: string, style: StyleConfig): SceneNode => ({
        tag: "path",
        d,
        style
    })
};

// Aliases for more JSX-like or functional usage
export const View = Amethyst.view;
export const Text = Amethyst.text;
export const ImageComp = Amethyst.image; // Avoid collision with global Image
export const Circle = Amethyst.circle;
export const Rect = Amethyst.rect;
export const Path = Amethyst.path;
