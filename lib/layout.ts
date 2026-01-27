import Yoga from "yoga-layout";
type YogaNode = any; // Fallback to any for now to resolve build, Yoga 3 types are complex in some environments
import type { SceneNode, StyleConfig, FlexDimension } from "./types.js";

function parseDimension(value: FlexDimension | undefined): { value: number; unit: "px" | "percent" | "auto" } {
    if (value === undefined || value === "auto") return { value: 0, unit: "auto" };
    if (typeof value === "number") return { value, unit: "px" };
    if (typeof value === "string" && value.endsWith("%")) {
        return { value: parseFloat(value), unit: "percent" };
    }
    return { value: parseFloat(value as string) || 0, unit: "px" };
}

function applyDimension(
    yogaNode: YogaNode,
    value: FlexDimension | undefined,
    pxFunc: (v: number) => void,
    percentFunc: (v: number) => void,
    autoFunc?: () => void
) {
    const parsed = parseDimension(value);
    if (parsed.unit === "px") pxFunc(parsed.value);
    else if (parsed.unit === "percent") percentFunc(parsed.value);
    else if (autoFunc) autoFunc();
}

export function calculateLayout(node: SceneNode, containerWidth: number, containerHeight: number): YogaNode {
    function applyStyles(yogaNode: YogaNode, style: StyleConfig) {
        // Flex Direction
        if (style.flexDirection === "column") yogaNode.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
        else if (style.flexDirection === "row") yogaNode.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);

        // Positioning
        if (style.position === "absolute") yogaNode.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE);
        else yogaNode.setPositionType(Yoga.POSITION_TYPE_RELATIVE);

        // Sizing
        applyDimension(yogaNode, style.width, v => yogaNode.setWidth(v), v => yogaNode.setWidthPercent(v), () => yogaNode.setWidthAuto());
        applyDimension(yogaNode, style.height, v => yogaNode.setHeight(v), v => yogaNode.setHeightPercent(v), () => yogaNode.setHeightAuto());

        if (style.aspectRatio) yogaNode.setAspectRatio(style.aspectRatio);

        // Margins
        applyDimension(yogaNode, style.margin, v => yogaNode.setMargin(Yoga.EDGE_ALL, v), v => yogaNode.setMarginPercent(Yoga.EDGE_ALL, v), () => yogaNode.setMarginAuto(Yoga.EDGE_ALL));
        applyDimension(yogaNode, style.marginTop, v => yogaNode.setMargin(Yoga.EDGE_TOP, v), v => yogaNode.setMarginPercent(Yoga.EDGE_TOP, v), () => yogaNode.setMarginAuto(Yoga.EDGE_TOP));
        applyDimension(yogaNode, style.marginBottom, v => yogaNode.setMargin(Yoga.EDGE_BOTTOM, v), v => yogaNode.setMarginPercent(Yoga.EDGE_BOTTOM, v), () => yogaNode.setMarginAuto(Yoga.EDGE_BOTTOM));
        applyDimension(yogaNode, style.marginLeft, v => yogaNode.setMargin(Yoga.EDGE_LEFT, v), v => yogaNode.setMarginPercent(Yoga.EDGE_LEFT, v), () => yogaNode.setMarginAuto(Yoga.EDGE_LEFT));
        applyDimension(yogaNode, style.marginRight, v => yogaNode.setMargin(Yoga.EDGE_RIGHT, v), v => yogaNode.setMarginPercent(Yoga.EDGE_RIGHT, v), () => yogaNode.setMarginAuto(Yoga.EDGE_RIGHT));

        // Padding
        applyDimension(yogaNode, style.padding, v => yogaNode.setPadding(Yoga.EDGE_ALL, v), v => yogaNode.setPaddingPercent(Yoga.EDGE_ALL, v));
        applyDimension(yogaNode, style.paddingTop, v => yogaNode.setPadding(Yoga.EDGE_TOP, v), v => yogaNode.setPaddingPercent(Yoga.EDGE_TOP, v));
        applyDimension(yogaNode, style.paddingBottom, v => yogaNode.setPadding(Yoga.EDGE_BOTTOM, v), v => yogaNode.setPaddingPercent(Yoga.EDGE_BOTTOM, v));
        applyDimension(yogaNode, style.paddingLeft, v => yogaNode.setPadding(Yoga.EDGE_LEFT, v), v => yogaNode.setPaddingPercent(Yoga.EDGE_LEFT, v));
        applyDimension(yogaNode, style.paddingRight, v => yogaNode.setPadding(Yoga.EDGE_RIGHT, v), v => yogaNode.setPaddingPercent(Yoga.EDGE_RIGHT, v));

        // Absolute Position
        applyDimension(yogaNode, style.top, v => yogaNode.setPosition(Yoga.EDGE_TOP, v), v => yogaNode.setPositionPercent(Yoga.EDGE_TOP, v));
        applyDimension(yogaNode, style.bottom, v => yogaNode.setPosition(Yoga.EDGE_BOTTOM, v), v => yogaNode.setPositionPercent(Yoga.EDGE_BOTTOM, v));
        applyDimension(yogaNode, style.left, v => yogaNode.setPosition(Yoga.EDGE_LEFT, v), v => yogaNode.setPositionPercent(Yoga.EDGE_LEFT, v));
        applyDimension(yogaNode, style.right, v => yogaNode.setPosition(Yoga.EDGE_RIGHT, v), v => yogaNode.setPositionPercent(Yoga.EDGE_RIGHT, v));

        // Flex properties
        if (style.flex !== undefined) yogaNode.setFlex(style.flex);
        if (style.flexGrow !== undefined) yogaNode.setFlexGrow(style.flexGrow);
        if (style.flexShrink !== undefined) yogaNode.setFlexShrink(style.flexShrink);
        applyDimension(yogaNode, style.flexBasis, v => yogaNode.setFlexBasis(v), v => yogaNode.setFlexBasisPercent(v), () => yogaNode.setFlexBasisAuto());

        // Gap
        if (style.gap !== undefined) yogaNode.setGap(Yoga.GUTTER_ALL, style.gap);
        if (style.rowGap !== undefined) yogaNode.setGap(Yoga.GUTTER_ROW, style.rowGap);
        if (style.columnGap !== undefined) yogaNode.setGap(Yoga.GUTTER_COLUMN, style.columnGap);

        // Alignment
        const justifyMap: Record<string, number> = {
            "flex-start": Yoga.JUSTIFY_FLEX_START,
            "center": Yoga.JUSTIFY_CENTER,
            "flex-end": Yoga.JUSTIFY_FLEX_END,
            "space-between": Yoga.JUSTIFY_SPACE_BETWEEN,
            "space-around": Yoga.JUSTIFY_SPACE_AROUND,
            "space-evenly": Yoga.JUSTIFY_SPACE_EVENLY,
        };
        if (style.justifyContent && justifyMap[style.justifyContent] !== undefined) {
            yogaNode.setJustifyContent(justifyMap[style.justifyContent]);
        }

        const alignMap: Record<string, number> = {
            "flex-start": Yoga.ALIGN_FLEX_START,
            "center": Yoga.ALIGN_CENTER,
            "flex-end": Yoga.ALIGN_FLEX_END,
            "stretch": Yoga.ALIGN_STRETCH,
            "baseline": Yoga.ALIGN_BASELINE,
            "auto": Yoga.ALIGN_AUTO,
        };
        if (style.alignItems && alignMap[style.alignItems] !== undefined) {
            yogaNode.setAlignItems(alignMap[style.alignItems]);
        }
        if (style.alignSelf && alignMap[style.alignSelf] !== undefined) {
            yogaNode.setAlignSelf(alignMap[style.alignSelf]);
        }
    }

    function buildTree(sceneNode: SceneNode): YogaNode {
        const yogaNode = Yoga.Node.create();
        applyStyles(yogaNode, sceneNode.style);

        if (sceneNode.children) {
            sceneNode.children.forEach((child, i) => {
                yogaNode.insertChild(buildTree(child), i);
            });
        }
        return yogaNode;
    }

    const layoutTree = buildTree(node);
    layoutTree.calculateLayout(containerWidth, containerHeight, Yoga.DIRECTION_LTR);
    return layoutTree;
}
