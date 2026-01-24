use tiny_skia::*;
use taffy::prelude::*;
use image::{ImageBuffer, Rgba};
use svgtypes::PathParser;

use crate::types::{SceneNode, StyleConfig};
use crate::utils::{parse_color, parse_blend_mode};
use crate::engine::EngineCore;
use crate::text::compute_text_lines;

fn apply_image_filters(pixmap: &mut Pixmap, style: &StyleConfig) {
    let gs = style.grayscale.unwrap_or(0.0).clamp(0.0, 1.0);
    let br = style.brightness.unwrap_or(1.0).max(0.0);
    let ct = style.contrast.unwrap_or(1.0).max(0.0);
    let sat = style.saturation.unwrap_or(1.0).max(0.0);
    let inv = style.invert.unwrap_or(0.0).clamp(0.0, 1.0);
    let sep = style.sepia.unwrap_or(0.0).clamp(0.0, 1.0);
    let blur_radius = style.blur.unwrap_or(0.0).max(0.0);

    let has_color_matrix = gs != 0.0 || br != 1.0 || ct != 1.0 || sat != 1.0 || inv != 0.0 || sep != 0.0;

    if has_color_matrix {
        let data = pixmap.data_mut();
        for i in (0..data.len()).step_by(4) {
            let alpha = data[i+3];
            if alpha == 0 { continue; }
            let a_f = alpha as f32 / 255.0;
            
            // Un-premultiply
            let mut r = (data[i] as f32 / 255.0) / a_f;
            let mut g = (data[i+1] as f32 / 255.0) / a_f;
            let mut b = (data[i+2] as f32 / 255.0) / a_f;

            // 1. Grayscale & Saturation
            let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            let sat_r = lum * (1.0 - sat) + r * sat;
            let sat_g = lum * (1.0 - sat) + g * sat;
            let sat_b = lum * (1.0 - sat) + b * sat;

            r = sat_r * (1.0 - gs) + lum * gs;
            g = sat_g * (1.0 - gs) + lum * gs;
            b = sat_b * (1.0 - gs) + lum * gs;

            // 2. Contrast
            if ct != 1.0 {
                r = (r - 0.5) * ct + 0.5;
                g = (g - 0.5) * ct + 0.5;
                b = (b - 0.5) * ct + 0.5;
            }

            // 3. Brightness
            r *= br; g *= br; b *= br;

            // 4. Invert
            if inv > 0.0 {
                r = r * (1.0 - inv) + (1.0 - r) * inv;
                g = g * (1.0 - inv) + (1.0 - g) * inv;
                b = b * (1.0 - inv) + (1.0 - b) * inv;
            }

            // 5. Sepia
            if sep > 0.0 {
                let sr = (r * 0.393) + (g * 0.769) + (b * 0.189);
                let sg = (r * 0.349) + (g * 0.686) + (b * 0.168);
                let sb = (r * 0.272) + (g * 0.534) + (b * 0.131);
                r = r * (1.0 - sep) + sr * sep;
                g = g * (1.0 - sep) + sg * sep;
                b = b * (1.0 - sep) + sb * sep;
            }

            // Re-premultiply and clamp
            data[i] = ((r * a_f * 255.0).clamp(0.0, 255.0)) as u8;
            data[i+1] = ((g * a_f * 255.0).clamp(0.0, 255.0)) as u8;
            data[i+2] = ((b * a_f * 255.0).clamp(0.0, 255.0)) as u8;
        }
    }

    if blur_radius > 0.0 {
        let w = pixmap.width();
        let h = pixmap.height();
        if let Some(img_buffer) = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(w, h, pixmap.data().to_vec()) {
            let blurred = image::imageops::blur(&img_buffer, blur_radius);
            let data = pixmap.data_mut();
            data.copy_from_slice(blurred.as_raw());
        }
    }
}

pub fn draw_scene(
    taffy: &Taffy, 
    node: &SceneNode, 
    layout_id: Node, 
    pixmap: &mut Pixmap, 
    engine: &EngineCore, 
    parent_x: f32, 
    parent_y: f32, 
    parent_opacity: f32
) {
    let layout = taffy.layout(layout_id).unwrap();
    let x = parent_x + layout.location.x;
    let y = parent_y + layout.location.y;
    let w = layout.size.width;
    let h = layout.size.height;

    if (w <= 0.0 || h <= 0.0) && node.text.is_none() && node.d.is_none() && node.tag != "circle" && node.tag != "ellipse" { return; }

    let mut transform = Transform::from_translate(x, y);
    
    // Transform Origin (Center by default)
    let cx = w / 2.0; 
    let cy = h / 2.0;

    // Apply Transforms: Translate Center -> Skew -> Scale -> Rotate -> Translate Back
    transform = transform.pre_translate(cx, cy);

    if let Some(r) = node.style.rotate {
        transform = transform.pre_rotate(r);
    }
    
    // Skew (in degrees)
    if node.style.skewX.is_some() || node.style.skewY.is_some() {
        let sx = node.style.skewX.unwrap_or(0.0).to_radians().tan();
        let sy = node.style.skewY.unwrap_or(0.0).to_radians().tan();
        // Transform::from_skew returns a Transform, not Option in this version of tiny-skia
        let skew_mat = Transform::from_skew(sx, sy);
        transform = transform.pre_concat(skew_mat);
    }

    if let Some(s) = node.style.scale {
        transform = transform.pre_scale(s, s);
    }

    transform = transform.pre_translate(-cx, -cy);

    let current_opacity = parent_opacity * node.style.opacity.unwrap_or(1.0);
    let blend_mode = parse_blend_mode(node.style.blendMode.as_deref().unwrap_or("normal"));
    let is_clipped = node.style.overflow.as_deref() == Some("hidden");

    let path = if let Some(d) = &node.d {
        let mut pb = PathBuilder::new();
        let mut current_x = 0.0;
        let mut current_y = 0.0;
        let segments = PathParser::from(d.as_str());
        for segment in segments {
             match segment {
                 Ok(svgtypes::PathSegment::MoveTo { abs, x, y }) => { let dx = if abs { x as f32 } else { current_x + x as f32 }; let dy = if abs { y as f32 } else { current_y + y as f32 }; pb.move_to(dx, dy); current_x = dx; current_y = dy; },
                 Ok(svgtypes::PathSegment::LineTo { abs, x, y }) => { let dx = if abs { x as f32 } else { current_x + x as f32 }; let dy = if abs { y as f32 } else { current_y + y as f32 }; pb.line_to(dx, dy); current_x = dx; current_y = dy; },
                 Ok(svgtypes::PathSegment::CurveTo { abs, x1, y1, x2, y2, x, y }) => { let cx1 = if abs { x1 as f32 } else { current_x + x1 as f32 }; let cy1 = if abs { y1 as f32 } else { current_y + y1 as f32 }; let cx2 = if abs { x2 as f32 } else { current_x + x2 as f32 }; let cy2 = if abs { y2 as f32 } else { current_y + y2 as f32 }; let dx = if abs { x as f32 } else { current_x + x as f32 }; let dy = if abs { y as f32 } else { current_y + y as f32 }; pb.cubic_to(cx1, cy1, cx2, cy2, dx, dy); current_x = dx; current_y = dy; },
                 Ok(svgtypes::PathSegment::Quadratic { abs, x1, y1, x, y }) => { let cx1 = if abs { x1 as f32 } else { current_x + x1 as f32 }; let cy1 = if abs { y1 as f32 } else { current_y + y1 as f32 }; let dx = if abs { x as f32 } else { current_x + x as f32 }; let dy = if abs { y as f32 } else { current_y + y as f32 }; pb.quad_to(cx1, cy1, dx, dy); current_x = dx; current_y = dy; },
                 Ok(svgtypes::PathSegment::ClosePath { .. }) => { pb.close(); },
                 _ => {}
            }
        }
        pb.finish()
    } else if node.tag == "circle" || node.tag == "ellipse" {
        let mut pb = PathBuilder::new();
        let rect = tiny_skia::Rect::from_xywh(0.0, 0.0, w, h).unwrap_or(tiny_skia::Rect::from_xywh(0.0,0.0,1.0,1.0).unwrap());
        pb.push_oval(rect);
        pb.finish()
    } else {
        let mut pb = PathBuilder::new();
        let tl = node.style.borderTopLeftRadius.or(node.style.borderRadius).unwrap_or(0.0).min(w/2.0).min(h/2.0);
        let tr = node.style.borderTopRightRadius.or(node.style.borderRadius).unwrap_or(0.0).min(w/2.0).min(h/2.0);
        let br = node.style.borderBottomRightRadius.or(node.style.borderRadius).unwrap_or(0.0).min(w/2.0).min(h/2.0);
        let bl = node.style.borderBottomLeftRadius.or(node.style.borderRadius).unwrap_or(0.0).min(w/2.0).min(h/2.0);
        pb.move_to(tl, 0.0); pb.line_to(w - tr, 0.0); pb.quad_to(w, 0.0, w, tr); pb.line_to(w, h - br); pb.quad_to(w, h, w - br, h); pb.line_to(bl, h); pb.quad_to(0.0, h, 0.0, h - bl); pb.line_to(0.0, tl); pb.quad_to(0.0, 0.0, tl, 0.0); pb.close();
        pb.finish()
    };
    
    let path = match path {
        Some(p) => p,
        None => {
            let fw = w.max(1.0);
            let fh = h.max(1.0);
            let mut pb = PathBuilder::new();
            pb.move_to(0.0, 0.0); pb.line_to(fw, 0.0); pb.line_to(fw, fh); pb.line_to(0.0, fh); pb.close();
            pb.finish().unwrap()
        }
    };

    // Shadow
    if let Some(sc) = &node.style.shadowColor {
        let mut shadow_paint = Paint::default();
        let mut color = parse_color(sc);
        let blur_alpha = (current_opacity * 0.3).min(1.0);
        color.set_alpha(color.alpha() * blur_alpha);
        shadow_paint.set_color(color);
        shadow_paint.blend_mode = BlendMode::SourceOver; 
        let shadow_transform = transform.post_translate(node.style.shadowOffsetX.unwrap_or(10.0), node.style.shadowOffsetY.unwrap_or(10.0));
        pixmap.fill_path(&path, &shadow_paint, FillRule::Winding, shadow_transform, None);
    }

    // Fill
    let mut fill_paint = Paint::default();
    fill_paint.blend_mode = blend_mode; // Apply blend mode to primitive
    let mut has_fill = false;
    
    if let Some(grad) = &node.style.backgroundGradient {
        let mut stops = Vec::new();
        for i in 0..grad.colors.len() {
            let mut color = parse_color(&grad.colors[i]);
            color.set_alpha(color.alpha() * current_opacity);
            let pos = match &grad.stops { Some(s) => s[i], None => i as f32 / (grad.colors.len() as f32 - 1.0).max(1.0) };
            stops.push(GradientStop::new(pos, color));
        }
        if grad.r#type.as_deref() == Some("radial") {
            let center = Point::from_xy(w/2.0, h/2.0);
            let radius = (w.max(h)) / 1.2;
            if let Some(shader) = RadialGradient::new(center, center, radius, stops, SpreadMode::Pad, Transform::identity()) {
                fill_paint.shader = shader; has_fill = true;
            }
        } else {
            let angle = grad.angle.unwrap_or(0.0).to_radians();
            let dx = angle.cos(); let dy = angle.sin();
            let start = Point::from_xy(w/2.0 - dx*w/2.0, h/2.0 - dy*h/2.0);
            let end = Point::from_xy(w/2.0 + dx*w/2.0, h/2.0 + dy*h/2.0);
            if let Some(shader) = LinearGradient::new(start, end, stops, SpreadMode::Pad, Transform::identity()) {
                fill_paint.shader = shader; has_fill = true;
            }
        }
    } else if let Some(bg) = &node.style.backgroundColor {
        let mut color = parse_color(bg);
        color.set_alpha(color.alpha() * current_opacity);
        fill_paint.set_color(color);
        has_fill = true;
    }
    if has_fill { pixmap.fill_path(&path, &fill_paint, FillRule::Winding, transform, None); }

    // Stroke
    if let Some(bw) = node.style.borderWidth {
        if bw > 0.0 {
            if let Some(bc) = &node.style.borderColor {
                let mut stroke_paint = Paint::default();
                stroke_paint.blend_mode = blend_mode; // Apply blend mode to stroke
                let mut color = parse_color(bc);
                color.set_alpha(color.alpha() * current_opacity);
                stroke_paint.set_color(color);
                let mut stroke = Stroke::default();
                stroke.width = bw;
                stroke.line_cap = match node.style.strokeLineCap.as_deref() { Some("round") => LineCap::Round, Some("square") => LineCap::Square, _ => LineCap::Butt };
                stroke.line_join = match node.style.strokeLineJoin.as_deref() { Some("round") => LineJoin::Round, Some("bevel") => LineJoin::Bevel, _ => LineJoin::Miter };
                if let Some(dash_array) = &node.style.strokeDashArray {
                    let array: &Vec<f32> = dash_array; // Explicit type check hint
                    if array.len() > 0 { 
                        stroke.dash = StrokeDash::new(array.clone(), node.style.strokeDashOffset.unwrap_or(0.0)); 
                    }
                }
                pixmap.stroke_path(&path, &stroke_paint, &stroke, transform, None);
            }
        }
    }

    // Image
    if node.tag == "image" {
        if let Some(src) = &node.src {
            if let Some(img_pixmap) = engine.assets.get(src) {
                let mut img_paint = PixmapPaint::default(); 
                img_paint.opacity = current_opacity; 
                img_paint.quality = FilterQuality::Bilinear;
                img_paint.blend_mode = blend_mode; // Apply blend mode to image

                let img_w = img_pixmap.width() as f32; let img_h = img_pixmap.height() as f32;
                let fit = node.style.objectFit.as_deref().unwrap_or("fill");
                let (sx, sy, tx, ty) = match fit { "cover" => { let s = (w / img_w).max(h / img_h); (s, s, (w - img_w * s) / 2.0, (h - img_h * s) / 2.0) }, "contain" => { let s = (w / img_w).min(h / img_h); (s, s, (w - img_w * s) / 2.0, (h - img_h * s) / 2.0) }, _ => (w / img_w, h / img_h, 0.0, 0.0) };
                let img_transform = transform.pre_translate(tx, ty).pre_scale(sx, sy);
                
                let has_filters = node.style.grayscale.is_some() || node.style.brightness.is_some() || node.style.contrast.is_some() || node.style.saturation.is_some() || node.style.invert.is_some() || node.style.sepia.is_some() || node.style.blur.is_some();
                                  
                if has_filters { 
                    let mut filtered = img_pixmap.clone(); 
                    apply_image_filters(&mut filtered, &node.style); 
                    pixmap.draw_pixmap(0, 0, filtered.as_ref(), &img_paint, img_transform, None); 
                } 
                else { 
                    pixmap.draw_pixmap(0, 0, img_pixmap.as_ref(), &img_paint, img_transform, None); 
                }
            }
        }
    }

    // Text
    if let Some(text_content) = &node.text {
        let font_name = node.style.fontFamily.as_deref().unwrap_or("default");
        let font_opt = engine.fonts.get(font_name).or_else(|| engine.fonts.values().next());
        
        if let Some(font) = font_opt {
            let size = node.style.fontSize.unwrap_or(32.0);
            let color = parse_color(node.style.color.as_deref().unwrap_or("#ffffff"));
            let lh = node.style.lineHeight.unwrap_or(size * 1.2);
            let letter_spacing = node.style.letterSpacing.unwrap_or(0.0);
            let align = node.style.textAlign.as_deref().unwrap_or("left");

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
                            let a_norm = (*alpha as f32 / 255.0) * current_opacity;
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

    if let Some(children) = &node.children {
        let child_ids = taffy.children(layout_id).unwrap();
        let mut paired: Vec<(&SceneNode, &Node)> = children.iter().zip(child_ids.iter()).collect();
        paired.sort_by_key(|(child, _)| child.style.zIndex.unwrap_or(0));
        
        let needs_layer = is_clipped || blend_mode != BlendMode::SourceOver;

        if needs_layer {
            let mut mask = Mask::new(pixmap.width(), pixmap.height()).unwrap();
            mask.fill_path(&path, FillRule::Winding, true, transform);
            
            let mut layer = Pixmap::new(pixmap.width(), pixmap.height()).unwrap();
            for (child, &cid) in paired {
                draw_scene(taffy, child, cid, &mut layer, engine, x, y, current_opacity);
            }
            
            let mut layer_paint = PixmapPaint::default();
            layer_paint.blend_mode = blend_mode; 
            
            pixmap.draw_pixmap(0, 0, layer.as_ref(), &layer_paint, Transform::identity(), Some(&mask));
        } else {
            for (child, &cid) in paired {
                draw_scene(taffy, child, cid, pixmap, engine, x, y, current_opacity);
            }
        }
    }
}