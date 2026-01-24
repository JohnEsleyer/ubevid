
use tiny_skia::{Color, BlendMode, Point};
use svgtypes::{PathParser, PathSegment};

pub fn parse_color(hex: &str) -> Color {
    let hex = hex.trim_start_matches('#');
    let (r, g, b, a) = match hex.len() {
        3 => (
            u8::from_str_radix(&hex[0..1], 16).unwrap_or(0) * 17,
            u8::from_str_radix(&hex[1..2], 16).unwrap_or(0) * 17,
            u8::from_str_radix(&hex[2..3], 16).unwrap_or(0) * 17,
            255
        ),
        6 => (u8::from_str_radix(&hex[0..2], 16).unwrap_or(0), u8::from_str_radix(&hex[2..4], 16).unwrap_or(0), u8::from_str_radix(&hex[4..6], 16).unwrap_or(0), 255),
        8 => (u8::from_str_radix(&hex[0..2], 16).unwrap_or(0), u8::from_str_radix(&hex[2..4], 16).unwrap_or(0), u8::from_str_radix(&hex[4..6], 16).unwrap_or(0), u8::from_str_radix(&hex[6..8], 16).unwrap_or(255)),
        _ => (255, 255, 255, 255)
    };
    Color::from_rgba8(r, g, b, a)
}

pub fn parse_blend_mode(mode: &str) -> BlendMode {
    match mode {
        "sourceOver" => BlendMode::SourceOver,
        "screen" => BlendMode::Screen,
        "overlay" => BlendMode::Overlay,
        "darken" => BlendMode::Darken,
        "lighten" => BlendMode::Lighten,
        "colorDodge" => BlendMode::ColorDodge,
        "colorBurn" => BlendMode::ColorBurn,
        "hardLight" => BlendMode::HardLight,
        "softLight" => BlendMode::SoftLight,
        "difference" => BlendMode::Difference,
        "exclusion" => BlendMode::Exclusion,
        "multiply" => BlendMode::Multiply,
        "hue" => BlendMode::Hue,
        "saturation" => BlendMode::Saturation,
        "color" => BlendMode::Color,
        "luminosity" => BlendMode::Luminosity,
        "plus" => BlendMode::Plus,
        "xor" => BlendMode::Xor,
        _ => BlendMode::SourceOver,
    }
}

fn dist(p1: Point, p2: Point) -> f32 {
    let dx = p1.x - p2.x;
    let dy = p1.y - p2.y;
    (dx * dx + dy * dy).sqrt()
}

// Simple adaptive subdivision for curve length
fn curve_length(p1: Point, p2: Point, p3: Point, p4: Point) -> f32 {
    let chord = dist(p1, p4);
    let cont_net = dist(p1, p2) + dist(p2, p3) + dist(p3, p4);
    
    if (cont_net - chord) < 0.1 {
        return cont_net;
    }
    
    let p12 = Point::from_xy((p1.x + p2.x) / 2.0, (p1.y + p2.y) / 2.0);
    let p23 = Point::from_xy((p2.x + p3.x) / 2.0, (p2.y + p3.y) / 2.0);
    let p34 = Point::from_xy((p3.x + p4.x) / 2.0, (p3.y + p4.y) / 2.0);
    let p123 = Point::from_xy((p12.x + p23.x) / 2.0, (p12.y + p23.y) / 2.0);
    let p234 = Point::from_xy((p23.x + p34.x) / 2.0, (p23.y + p34.y) / 2.0);
    let p1234 = Point::from_xy((p123.x + p234.x) / 2.0, (p123.y + p234.y) / 2.0);

    curve_length(p1, p12, p123, p1234) + curve_length(p1234, p234, p34, p4)
}

fn quad_length(p1: Point, p2: Point, p3: Point) -> f32 {
    // Elevate quadratic to cubic
    let p2_c = Point::from_xy(p1.x + (2.0/3.0)*(p2.x - p1.x), p1.y + (2.0/3.0)*(p2.y - p1.y));
    let p3_c = Point::from_xy(p3.x + (2.0/3.0)*(p2.x - p3.x), p3.y + (2.0/3.0)*(p2.y - p3.y));
    curve_length(p1, p2_c, p3_c, p3)
}

pub fn calculate_path_length(d: &str) -> f32 {
    let mut length = 0.0;
    let mut curr = Point::from_xy(0.0, 0.0);
    let mut start = Point::from_xy(0.0, 0.0);

    for segment in PathParser::from(d) {
        match segment {
            Ok(PathSegment::MoveTo { abs, x, y }) => {
                let p = if abs { Point::from_xy(x as f32, y as f32) } else { Point::from_xy(curr.x + x as f32, curr.y + y as f32) };
                curr = p;
                start = p;
            },
            Ok(PathSegment::LineTo { abs, x, y }) => {
                let p = if abs { Point::from_xy(x as f32, y as f32) } else { Point::from_xy(curr.x + x as f32, curr.y + y as f32) };
                length += dist(curr, p);
                curr = p;
            },
            Ok(PathSegment::HorizontalLineTo { abs, x }) => {
                 let p = if abs { Point::from_xy(x as f32, curr.y) } else { Point::from_xy(curr.x + x as f32, curr.y) };
                 length += dist(curr, p);
                 curr = p;
            },
            Ok(PathSegment::VerticalLineTo { abs, y }) => {
                 let p = if abs { Point::from_xy(curr.x, y as f32) } else { Point::from_xy(curr.x, curr.y + y as f32) };
                 length += dist(curr, p);
                 curr = p;
            },
            Ok(PathSegment::CurveTo { abs, x1, y1, x2, y2, x, y }) => {
                let p1 = if abs { Point::from_xy(x1 as f32, y1 as f32) } else { Point::from_xy(curr.x + x1 as f32, curr.y + y1 as f32) };
                let p2 = if abs { Point::from_xy(x2 as f32, y2 as f32) } else { Point::from_xy(curr.x + x2 as f32, curr.y + y2 as f32) };
                let p3 = if abs { Point::from_xy(x as f32, y as f32) } else { Point::from_xy(curr.x + x as f32, curr.y + y as f32) };
                length += curve_length(curr, p1, p2, p3);
                curr = p3;
            },
            Ok(PathSegment::Quadratic { abs, x1, y1, x, y }) => {
                let p1 = if abs { Point::from_xy(x1 as f32, y1 as f32) } else { Point::from_xy(curr.x + x1 as f32, curr.y + y1 as f32) };
                let p2 = if abs { Point::from_xy(x as f32, y as f32) } else { Point::from_xy(curr.x + x as f32, curr.y + y as f32) };
                length += quad_length(curr, p1, p2);
                curr = p2;
            },
            Ok(PathSegment::ClosePath { .. }) => {
                length += dist(curr, start);
                curr = start;
            }
            _ => {}
        }
    }
    length
}
