use tiny_skia::*;
use crate::types::SceneNode;
use crate::utils::{parse_color, parse_blend_mode};
use crate::engine::EngineCore;
use crate::text::compute_text_lines;

pub fn draw_text(
    pixmap: &mut Pixmap,
    node: &SceneNode,
    text_content: &str,
    transform: Transform,
    engine: &EngineCore,
    w: f32,
    opacity: f32
) {
    let blend_mode = parse_blend_mode(node.style.blend_mode.as_deref().unwrap_or("normal"));
    let font_name = node.style.font_family.as_deref().unwrap_or("default");
    let font_opt = engine.fonts.get(font_name).or_else(|| engine.fonts.values().next());
    
    if let Some(font) = font_opt {
        let size = node.style.font_size.unwrap_or(32.0);
        let color = parse_color(node.style.color.as_deref().unwrap_or("#ffffff"));
        let lh = node.style.line_height.unwrap_or(size * 1.2);
        let letter_spacing = node.style.letter_spacing.unwrap_or(0.0);
        let align = node.style.text_align.as_deref().unwrap_or("left");

        let wrap_width = if w > 0.0 { Some(w) } else { None };
        let lines = compute_text_lines(font, text_content, size, letter_spacing, wrap_width);

        for (li, line) in lines.iter().enumerate() {
            let ly = li as f32 * lh;
            let mut cx = match align {
                "center" => if w > 0.0 { (w - line.width) / 2.0 } else { 0.0 },
                "right" => if w > 0.0 { w - line.width } else { 0.0 },
                _ => 0.0
            };

            for (c, adv) in &line.chars {
                let glyph = engine.get_glyph(font_name, font, *c, size);
                let metrics = &glyph.metrics;

                if metrics.width > 0 && metrics.height > 0 {
                    let gw = metrics.width as u32;
                    let gh = metrics.height as u32;
                    let req_len = (gw * gh * 4) as usize;
                    let mut buffer = engine.scratch_buffer.borrow_mut();
                    if buffer.len() < req_len { buffer.resize(req_len, 0); }
                    
                    let dest_slice = &mut buffer[0..req_len];
                    for (i, alpha) in glyph.bitmap.iter().enumerate() {
                        let a_norm = (*alpha as f32 / 255.0) * opacity;
                        let r = (color.red() * 255.0 * a_norm) as u8;
                        let g = (color.green() * 255.0 * a_norm) as u8;
                        let b = (color.blue() * 255.0 * a_norm) as u8;
                        let a = (a_norm * 255.0) as u8;
                        dest_slice[i*4] = r; dest_slice[i*4+1] = g; dest_slice[i*4+2] = b; dest_slice[i*4+3] = a;
                    }

                    if let Some(glyph_pixmap) = tiny_skia::PixmapRef::from_bytes(dest_slice, gw, gh) {
                        let cy = (ly + size - metrics.height as f32 - metrics.ymin as f32) as f32;
                        let mut text_paint = PixmapPaint::default();
                        text_paint.blend_mode = blend_mode;
                        pixmap.draw_pixmap(0, 0, glyph_pixmap, &text_paint, transform.post_translate(cx+metrics.xmin as f32, cy), None);
                    }
                }
                cx += adv;
            }
        }
    }
}
