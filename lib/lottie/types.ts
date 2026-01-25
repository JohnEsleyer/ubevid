
export interface LottieKeyframe {
    t: number; // Time (frames)
    s: any;    // Start Value
    e?: any;   // End Value
}

export interface LottieProperty {
    a: 0 | 1; // Animated?
    k: any;   // Value or Keyframes
}

export interface LottieBezier {
    i: [number, number][]; // In tangents (relative)
    o: [number, number][]; // Out tangents (relative)
    v: [number, number][]; // Vertices (absolute)
    c?: boolean;           // Closed
}

export interface LottieTransform {
    p: LottieProperty; // Position
    s: LottieProperty; // Scale
    r: LottieProperty; // Rotation
    o: LottieProperty; // Opacity
    a: LottieProperty; // Anchor Point
}

export interface LottieTrimPath {
    ty: "tm";
    s: LottieProperty; // Start
    e: LottieProperty; // End
    o: LottieProperty; // Offset
}

export interface LottiePolystar {
    ty: "sr";
    p: LottieProperty; // Position
    r: LottieProperty; // Rotation
    pt: LottieProperty; // Points
    or: LottieProperty; // Outer Radius
    os: LottieProperty; // Outer Roundness
    ir?: LottieProperty; // Inner Radius (Star only)
    is?: LottieProperty; // Inner Roundness (Star only)
    sy: LottieProperty; // Type: 1=Star, 2=Polygon
}

export interface LottieLayer {
    ind: number;
    ty: number; // 4 = Shape
    ks: LottieTransform;
    st: number; // Start Frame
    op: number; // Out Frame
    shapes?: any[];
}

export interface LottieJSON {
    fr: number;
    ip: number;
    op: number;
    w: number;
    h: number;
    layers: LottieLayer[];
}