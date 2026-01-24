use tiny_skia::{Color, BlendMode};

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