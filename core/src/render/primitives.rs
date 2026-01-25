use tiny_skia::*;
use crate::types::SceneNode;
use crate::utils::parse_color;

pub fn draw_primitive(
    pixmap: &mut Pixmap, 
    node: &SceneNode, 
    path: &Path, 
    transform: Transform, 
    opacity: f32,
    w: f32,
    h: f32
) {
    let mut paint = Paint::default();
    paint.anti_alias = true;

    let mut has_fill = false;

    if let Some(grad) = &node.style.background_gradient {
        let mut stops = Vec::new();
        for i in 0..grad.colors.len() {
            let mut color = parse_color(&grad.colors[i]);
            color.set_alpha(color.alpha() * opacity);
            let pos = match &grad.stops {
                Some(s) => s[i],
                None => i as f32 / (grad.colors.len() as f32 - 1.0).max(1.0),
            };
            stops.push(GradientStop::new(pos, color));
        }

        if grad.r#type.as_deref() == Some("radial") {
            let center = Point::from_xy(w / 2.0, h / 2.0);
            if let Some(shader) = RadialGradient::new(center, center, (w.max(h)) / 1.2, stops, SpreadMode::Pad, Transform::identity()) {
                paint.shader = shader; has_fill = true;
            }
        } else {
            let angle = grad.angle.unwrap_or(180.0) % 360.0;
            
            // PIXEL-PERFECT AXIAL MAPPING: 
            // We map to pixel centers (0.5 to length-0.5) to ensure 
            // the gradient reaches full value within the pixel grid.
            let (start, end) = if angle == 90.0 {
                (Point::from_xy(0.5, h / 2.0), Point::from_xy(w - 0.5, h / 2.0))
            } else if angle == 180.0 {
                (Point::from_xy(w / 2.0, 0.5), Point::from_xy(w / 2.0, h - 0.5))
            } else if angle == 270.0 {
                (Point::from_xy(w - 0.5, h / 2.0), Point::from_xy(0.5, h / 2.0))
            } else if angle == 0.0 || angle == 360.0 {
                (Point::from_xy(w / 2.0, h - 0.5), Point::from_xy(w / 2.0, 0.5))
            } else {
                let rad = (angle - 90.0).to_radians();
                let (sin, cos) = rad.sin_cos();
                let len = w.abs() * cos.abs() + h.abs() * sin.abs();
                let half_l = len / 2.0;
                let (cx, cy) = (w / 2.0, h / 2.0);
                (Point::from_xy(cx - cos * half_l, cy - sin * half_l),
                 Point::from_xy(cx + cos * half_l, cy + sin * half_l))
            };

            if let Some(shader) = LinearGradient::new(start, end, stops, SpreadMode::Pad, Transform::identity()) {
                paint.shader = shader; has_fill = true;
            }
        }
    } else if let Some(bg) = &node.style.background_color {
        let mut color = parse_color(bg);
        color.set_alpha(color.alpha() * opacity);
        paint.set_color(color);
        has_fill = true;
    }

    // CRITICAL: Only fill if a color or gradient was actually provided
    if has_fill {
        pixmap.fill_path(path, &paint, FillRule::Winding, transform, None);
    }

    if let Some(bw) = node.style.border_width {
        if bw > 0.0 {
            if let Some(bc) = &node.style.border_color {
                let mut sp = Paint::default();
                let mut color = parse_color(bc);
                color.set_alpha(color.alpha() * opacity);
                sp.set_color(color);
                pixmap.stroke_path(path, &sp, &Stroke { width: bw, ..Default::default() }, transform, None);
            }
        }
    }
}