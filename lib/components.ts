import type { SceneNode, StyleConfig, GradientConfig } from "./types.js";

/**
 * Component Props including Style and Node metadata
 */
export interface ComponentProps extends StyleConfig {
    mask?: SceneNode;
}

/**
 * High-level component API for building scene graphs.
 */
export const Amethyst = {
    view: (props: ComponentProps, children?: SceneNode[]): SceneNode => {
        const { mask, ...style } = props;
        return {
            tag: "view",
            style,
            mask,
            children
        };
    },

    text: (text: string, props: ComponentProps): SceneNode => {
        const { mask, ...style } = props;
        return {
            tag: "text",
            text,
            style,
            mask
        };
    },

    image: (src: string, props: ComponentProps): SceneNode => {
        const { mask, ...style } = props;
        return {
            tag: "image",
            src,
            style,
            mask
        };
    },

    circle: (props: ComponentProps): SceneNode => {
        const { mask, ...style } = props;
        return {
            tag: "circle",
            style,
            mask
        };
    },

    rect: (props: ComponentProps): SceneNode => {
        const { mask, ...style } = props;
        return {
            tag: "rect",
            style,
            mask
        };
    },

    path: (d: string, props: ComponentProps): SceneNode => {
        const { mask, ...style } = props;
        return {
            tag: "path",
            d,
            style,
            mask
        };
    }
};

// Aliases for more JSX-like or functional usage
export const View = Amethyst.view;
export const Text = Amethyst.text;
export const ImageComp = Amethyst.image; // Avoid collision with global Image
export const Circle = Amethyst.circle;
export const Rect = Amethyst.rect;
export const Path = Amethyst.path;
