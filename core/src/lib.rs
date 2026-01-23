use wasm_bindgen::prelude::*;
use tiny_skia::{Pixmap, Paint, Transform, Color, PixmapPaint, PathBuilder, FillRule, FilterQuality, LinearGradient, RadialGradient, Point, SpreadMode, GradientStop, Mask, Stroke, LineCap, LineJoin, StrokeDash};
use serde::{Deserialize, Serialize};
use taffy::prelude::*;
use fontdue::{Font, FontSettings};
use std::collections::HashMap;
use svgtypes::PathParser;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GradientConfig {
    pub r#type: Option<String>,
    pub colors: Vec<String>,
    pub stops: Option<Vec<f32>>,
    pub angle: Option<f32>,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SceneNode {
    pub tag: String,
    pub text: Option<String>,
    pub src: Option<String>,
    pub d: Option<String>,
    pub style: StyleConfig,
    pub children: Option<Vec<SceneNode>>,
}

#[derive(Deserialize, Serialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct StyleConfig {
    // Layout
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub aspectRatio: Option<f32>,
    pub flex: Option<f32>,
    pub flexDirection: Option<String>, 
    pub justifyContent: Option<String>,
    pub alignItems: Option<String>,
    pub margin: Option<f32>,
    pub marginTop: Option<f32>,
    pub marginBottom: Option<f32>,
    pub marginLeft: Option<f32>,
    pub marginRight: Option<f32>,
    pub padding: Option<f32>,
    pub position: Option<String>,
    pub top: Option<f32>,
    pub left: Option<f32>,
    pub right: Option<f32>,
    pub bottom: Option<f32>,
    pub zIndex: Option<i32>,
    pub overflow: Option<String>,

    // Visuals
    pub backgroundColor: Option<String>,
    pub backgroundGradient: Option<GradientConfig>,
    pub borderRadius: Option<f32>,
    pub borderTopLeftRadius: Option<f32>,
    pub borderTopRightRadius: Option<f32>,
    pub borderBottomLeftRadius: Option<f32>,
    pub borderBottomRightRadius: Option<f32>,
    pub borderColor: Option<String>,
    pub borderWidth: Option<f32>,
    pub opacity: Option<f32>,
    
    // Strokes (Advanced)
    pub strokeLineCap: Option<String>,   // "butt", "round", "square"
    pub strokeLineJoin: Option<String>,  // "miter", "round", "bevel"
    pub strokeDashArray: Option<Vec<f32>>,
    pub strokeDashOffset: Option<f32>,

    // Filters
    pub grayscale: Option<f32>,
    pub brightness: Option<f32>,
    pub contrast: Option<f32>,
    pub saturation: Option<f32>,

    // Shadows
    pub shadowColor: Option<String>,
    pub shadowBlur: Option<f32>,
    pub shadowOffsetX: Option<f32>,
    pub shadowOffsetY: Option<f32>,
    
    // Text
    pub color: Option<String>,
    pub fontSize: Option<f32>,
    pub fontFamily: Option<String>,
    pub textAlign: Option<String>,
    pub lineHeight: Option<f32>,
    pub letterSpacing: Option<f32>,

    // Image
    pub objectFit: Option<String>,
    
    // Transform
    pub rotate: Option<f32>,
    pub scale: Option<f32>,
}

struct TextLine {
    chars: Vec<(char, f32)>,
    width: f32,
}

fn parse_color(hex: &str) -> Color {
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

fn apply_image_filters(pixmap: &mut Pixmap, style: &StyleConfig) {
    let gs = style.grayscale.unwrap_or(0.0).clamp(0.0, 1.0);
    let br = style.brightness.unwrap_or(1.0).max(0.0);
    let ct = style.contrast.unwrap_or(1.0).max(0.0);
    let sat = style.saturation.unwrap_or(1.0).max(0.0);

    if gs == 0.0 && br == 1.0 && ct == 1.0 && sat == 1.0 { return; }

    let data = pixmap.data_mut();
    for i in (0..data.len()).step_by(4) {
        let alpha = data[i+3];
        if alpha == 0 { continue; }

        let a_f = alpha as f32 / 255.0;
        let mut r = (data[i] as f32 / 255.0) / a_f;
        let mut g = (data[i+1] as f32 / 255.0) / a_f;
        let mut b = (data[i+2] as f32 / 255.0) / a_f;

        let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        let sat_r = lum * (1.0 - sat) + r * sat;
        let sat_g = lum * (1.0 - sat) + g * sat;
        let sat_b = lum * (1.0 - sat) + b * sat;

        r = sat_r * (1.0 - gs) + lum * gs;
        g = sat_g * (1.0 - gs) + lum * gs;
        b = sat_b * (1.0 - gs) + lum * gs;

        if ct != 1.0 {
            r = (r - 0.5) * ct + 0.5;
            g = (g - 0.5) * ct + 0.5;
            b = (b - 0.5) * ct + 0.5;
        }

        r *= br;
        g *= br;
        b *= br;

        data[i] = ((r * a_f * 255.0).clamp(0.0, 255.0)) as u8;
        data[i+1] = ((g * a_f * 255.0).clamp(0.0, 255.0)) as u8;
        data[i+2] = ((b * a_f * 255.0).clamp(0.0, 255.0)) as u8;
    }
}

#[wasm_bindgen]
pub struct UbeEngine {
    fonts: HashMap<String, Font>,
    assets: HashMap<String, Pixmap>, 
}

#[wasm_bindgen]
impl UbeEngine {
    pub fn new() -> UbeEngine {
        UbeEngine { fonts: HashMap::new(), assets: HashMap::new() }
    }

    pub fn load_font(&mut self, name: &str, data: &[u8]) -> Result<(), JsValue> {
        let font = Font::from_bytes(data, FontSettings::default()).map_err(|e| JsValue::from_str(e))?;
        self.fonts.insert(name.to_string(), font);
        Ok(())
    }

    pub fn load_asset(&mut self, id: &str, data: &[u8]) -> Result<(), JsValue> {
        let img = image::load_from_memory(data).map_err(|e| JsValue::from_str(&e.to_string()))?;
        let mut rgba = img.to_rgba8();
        let width = rgba.width();
        let height = rgba.height();
        for p in rgba.chunks_exact_mut(4) {
            let a = p[3] as u16;
            if a != 255 {
                p[0] = ((p[0] as u16 * a) / 255) as u8;
                p[1] = ((p[1] as u16 * a) / 255) as u8;
                p[2] = ((p[2] as u16 * a) / 255) as u8;
            }
        }
        let pixmap = Pixmap::from_vec(rgba.into_raw(), tiny_skia::IntSize::from_wh(width, height).unwrap())
            .ok_or_else(|| JsValue::from_str("Failed to create pixmap"))?;
        self.assets.insert(id.to_string(), pixmap);
        Ok(())
    }

    pub fn render(&self, json_input: &str, width: u32, height: u32) -> Vec<u8> {
        let root_node: SceneNode = serde_json::from_str(json_input).unwrap();
        let mut taffy = Taffy::new();

        fn build_taffy(taffy: &mut Taffy, node: &SceneNode, assets: &HashMap<String, Pixmap>) -> Node {
            let mut w = node.style.width.map(Dimension::Points).unwrap_or(Dimension::Auto);
            let mut h = node.style.height.map(Dimension::Points).unwrap_or(Dimension::Auto);

            if node.tag == "image" {
                if let Some(src) = &node.src {
                    if let Some(pixmap) = assets.get(src) {
                        if matches!(w, Dimension::Auto) { w = Dimension::Points(pixmap.width() as f32); }
                        if matches!(h, Dimension::Auto) { h = Dimension::Points(pixmap.height() as f32); }
                    }
                }
            }

            let style = Style {
                size: Size { width: w, height: h },
                aspect_ratio: node.style.aspectRatio,
                position: match node.style.position.as_deref() {
                    Some("absolute") => Position::Absolute,
                    _ => Position::Relative,
                },
                flex_grow: node.style.flex.unwrap_or(0.0),
                flex_direction: match node.style.flexDirection.as_deref() {
                    Some("column") => FlexDirection::Column,
                    _ => FlexDirection::Row,
                },
                justify_content: Some(match node.style.justifyContent.as_deref() {
                    Some("center") => JustifyContent::Center,
                    Some("spaceBetween") => JustifyContent::SpaceBetween,
                    Some("flexEnd") => JustifyContent::FlexEnd,
                    _ => JustifyContent::FlexStart,
                }),
                align_items: Some(match node.style.alignItems.as_deref() {
                    Some("center") => AlignItems::Center,
                    Some("flexEnd") => AlignItems::FlexEnd,
                    _ => AlignItems::FlexStart,
                }),
                padding: Rect {
                    left: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
                    right: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
                    top: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
                    bottom: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
                },
                margin: Rect {
                    left: LengthPercentageAuto::Points(node.style.marginLeft.or(node.style.margin).unwrap_or(0.0)),
                    right: LengthPercentageAuto::Points(node.style.marginRight.or(node.style.margin).unwrap_or(0.0)),
                    top: LengthPercentageAuto::Points(node.style.marginTop.or(node.style.margin).unwrap_or(0.0)),
                    bottom: LengthPercentageAuto::Points(node.style.marginBottom.or(node.style.margin).unwrap_or(0.0)),
                },
                inset: Rect {
                    left: node.style.left.map(LengthPercentageAuto::Points).unwrap_or(LengthPercentageAuto::Auto),
                    right: node.style.right.map(LengthPercentageAuto::Points).unwrap_or(LengthPercentageAuto::Auto),
                    top: node.style.top.map(LengthPercentageAuto::Points).unwrap_or(LengthPercentageAuto::Auto),
                    bottom: node.style.bottom.map(LengthPercentageAuto::Points).unwrap_or(LengthPercentageAuto::Auto),
                },
                ..Default::default()
            };

            let mut child_ids = vec![];
            if let Some(children) = &node.children {
                for child in children { child_ids.push(build_taffy(taffy, child, assets)); }
            }
            taffy.new_with_children(style, &child_ids).unwrap()
        }

        let root = build_taffy(&mut taffy, &root_node, &self.assets);
        taffy.compute_layout(root, Size { 
            width: AvailableSpace::Definite(width as f32), 
            height: AvailableSpace::Definite(height as f32) 
        }).unwrap();

        let mut pixmap = Pixmap::new(width, height).unwrap();
        
        fn draw(
            taffy: &Taffy, 
            node: &SceneNode, 
            layout_id: Node, 
            pixmap: &mut Pixmap, 
            engine: &UbeEngine, 
            parent_x: f32, 
            parent_y: f32,
            parent_opacity: f32
        ) {
            let layout = taffy.layout(layout_id).unwrap();
            let x = parent_x + layout.location.x;
            let y = parent_y + layout.location.y;
            let w = layout.size.width;
            let h = layout.size.height;

            if w <= 0.0 || h <= 0.0 { return; }

            let mut transform = Transform::from_translate(x, y);
            if let Some(r) = node.style.rotate {
                let cx = w / 2.0; let cy = h / 2.0;
                transform = transform.pre_translate(cx, cy).pre_rotate(r).pre_translate(-cx, -cy);
            }
            if let Some(s) = node.style.scale {
                let cx = w / 2.0; let cy = h / 2.0;
                transform = transform.pre_translate(cx, cy).pre_scale(s, s).pre_translate(-cx, -cy);
            }

            let current_opacity = parent_opacity * node.style.opacity.unwrap_or(1.0);

            // Path construction
            let path = if node.tag == "path" && node.d.is_some() {
                let mut pb = PathBuilder::new();
                let mut current_x = 0.0;
                let mut current_y = 0.0;
                
                for segment in PathParser::from(node.d.as_ref().unwrap().as_str()) {
                    match segment {
                        Ok(svgtypes::PathSegment::MoveTo { abs, x, y }) => { 
                            let dx = if abs { x as f32 } else { current_x + x as f32 };
                            let dy = if abs { y as f32 } else { current_y + y as f32 };
                            pb.move_to(dx, dy);
                            current_x = dx; current_y = dy;
                        },
                        Ok(svgtypes::PathSegment::LineTo { abs, x, y }) => { 
                            let dx = if abs { x as f32 } else { current_x + x as f32 };
                            let dy = if abs { y as f32 } else { current_y + y as f32 };
                            pb.line_to(dx, dy);
                            current_x = dx; current_y = dy;
                        },
                        Ok(svgtypes::PathSegment::CurveTo { abs, x1, y1, x2, y2, x, y }) => { 
                            let cx1 = if abs { x1 as f32 } else { current_x + x1 as f32 };
                            let cy1 = if abs { y1 as f32 } else { current_y + y1 as f32 };
                            let cx2 = if abs { x2 as f32 } else { current_x + x2 as f32 };
                            let cy2 = if abs { y2 as f32 } else { current_y + y2 as f32 };
                            let dx = if abs { x as f32 } else { current_x + x as f32 };
                            let dy = if abs { y as f32 } else { current_y + y as f32 };
                            pb.cubic_to(cx1, cy1, cx2, cy2, dx, dy);
                            current_x = dx; current_y = dy;
                        },
                        Ok(svgtypes::PathSegment::Quadratic { abs, x1, y1, x, y }) => { 
                            let cx1 = if abs { x1 as f32 } else { current_x + x1 as f32 };
                            let cy1 = if abs { y1 as f32 } else { current_y + y1 as f32 };
                            let dx = if abs { x as f32 } else { current_x + x as f32 };
                            let dy = if abs { y as f32 } else { current_y + y as f32 };
                            pb.quad_to(cx1, cy1, dx, dy);
                            current_x = dx; current_y = dy;
                        },
                        Ok(svgtypes::PathSegment::ClosePath { .. }) => { pb.close(); },
                        _ => {}
                    }
                }
                pb.finish().unwrap_or_else(|| {
                   PathBuilder::from_rect(tiny_skia::Rect::from_xywh(0.0,0.0,w,h).unwrap())
                })
            } else {
                let mut pb = PathBuilder::new();
                let tl = node.style.borderTopLeftRadius.or(node.style.borderRadius).unwrap_or(0.0).min(w/2.0).min(h/2.0);
                let tr = node.style.borderTopRightRadius.or(node.style.borderRadius).unwrap_or(0.0).min(w/2.0).min(h/2.0);
                let br = node.style.borderBottomRightRadius.or(node.style.borderRadius).unwrap_or(0.0).min(w/2.0).min(h/2.0);
                let bl = node.style.borderBottomLeftRadius.or(node.style.borderRadius).unwrap_or(0.0).min(w/2.0).min(h/2.0);

                pb.move_to(tl, 0.0);
                pb.line_to(w - tr, 0.0);
                pb.quad_to(w, 0.0, w, tr);
                pb.line_to(w, h - br);
                pb.quad_to(w, h, w - br, h);
                pb.line_to(bl, h);
                pb.quad_to(0.0, h, 0.0, h - bl);
                pb.line_to(0.0, tl);
                pb.quad_to(0.0, 0.0, tl, 0.0);
                pb.close();
                pb.finish().unwrap()
            };

            let is_clipped = node.style.overflow.as_deref() == Some("hidden");

            // Shadow
            if let Some(sc) = &node.style.shadowColor {
                let mut shadow_paint = Paint::default();
                let mut color = parse_color(sc);
                let blur_alpha = (current_opacity * 0.3).min(1.0);
                color.set_alpha(color.alpha() * blur_alpha);
                shadow_paint.set_color(color);
                let shadow_transform = transform.post_translate(node.style.shadowOffsetX.unwrap_or(10.0), node.style.shadowOffsetY.unwrap_or(10.0));
                pixmap.fill_path(&path, &shadow_paint, FillRule::Winding, shadow_transform, None);
            }
            
            // Fill
            let mut fill_paint = Paint::default();
            let mut has_fill = false;
            if let Some(grad) = &node.style.backgroundGradient {
                let mut stops = Vec::new();
                for i in 0..grad.colors.len() {
                    let mut color = parse_color(&grad.colors[i]);
                    color.set_alpha(color.alpha() * current_opacity);
                    let pos = match &grad.stops {
                        Some(s) => s[i],
                        None => i as f32 / (grad.colors.len() as f32 - 1.0).max(1.0),
                    };
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

            // Stroke (Border)
            if let Some(bw) = node.style.borderWidth {
                if bw > 0.0 {
                    if let Some(bc) = &node.style.borderColor {
                        let mut stroke_paint = Paint::default();
                        let mut color = parse_color(bc);
                        color.set_alpha(color.alpha() * current_opacity);
                        stroke_paint.set_color(color);
                        
                        let mut stroke = Stroke::default();
                        stroke.width = bw;
                        
                        // Apply Line Cap
                        stroke.line_cap = match node.style.strokeLineCap.as_deref() {
                            Some("round") => LineCap::Round,
                            Some("square") => LineCap::Square,
                            _ => LineCap::Butt,
                        };

                        // Apply Line Join
                        stroke.line_join = match node.style.strokeLineJoin.as_deref() {
                            Some("round") => LineJoin::Round,
                            Some("bevel") => LineJoin::Bevel,
                            _ => LineJoin::Miter,
                        };

                        // Apply Dash Pattern
                        if let Some(dash_array) = &node.style.strokeDashArray {
                            if !dash_array.is_empty() {
                                stroke.dash = StrokeDash::new(dash_array.clone(), node.style.strokeDashOffset.unwrap_or(0.0));
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
                        let img_w = img_pixmap.width() as f32;
                        let img_h = img_pixmap.height() as f32;
                        let fit = node.style.objectFit.as_deref().unwrap_or("fill");
                        let (sx, sy, tx, ty) = match fit {
                            "cover" => { let s = (w / img_w).max(h / img_h); (s, s, (w - img_w * s) / 2.0, (h - img_h * s) / 2.0) },
                            "contain" => { let s = (w / img_w).min(h / img_h); (s, s, (w - img_w * s) / 2.0, (h - img_h * s) / 2.0) },
                            _ => (w / img_w, h / img_h, 0.0, 0.0),
                        };
                        let img_transform = transform.pre_translate(tx, ty).pre_scale(sx, sy);
                        
                        let has_filters = node.style.grayscale.is_some() || node.style.brightness.is_some() || node.style.contrast.is_some() || node.style.saturation.is_some();
                        if has_filters {
                            let mut filtered = img_pixmap.clone();
                            apply_image_filters(&mut filtered, &node.style);
                            pixmap.draw_pixmap(0, 0, filtered.as_ref(), &img_paint, img_transform, None);
                        } else {
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
                    let mut lines: Vec<TextLine> = vec![TextLine { chars: vec![], width: 0.0 }];
                    let letter_spacing = node.style.letterSpacing.unwrap_or(0.0);

                    for (i, word) in text_content.split(' ').enumerate() {
                        let word_with_space = if i == 0 { word.to_string() } else { format!(" {}", word) };
                        let mut ww = 0.0; let mut wc = vec![];
                        for c in word_with_space.chars() {
                            let adv = font.metrics(c, size).advance_width + letter_spacing; 
                            wc.push((c, adv)); ww += adv;
                        }
                        let line = lines.last_mut().unwrap();
                        if line.width + ww > w && !line.chars.is_empty() {
                            let trimmed: Vec<(char, f32)> = wc.into_iter().skip(if i > 0 { 1 } else { 0 }).collect();
                            let tw: f32 = trimmed.iter().map(|(_, a)| a).sum();
                            lines.push(TextLine { chars: trimmed, width: tw });
                        } else { line.chars.extend(wc); line.width += ww; }
                    }
                    let lh = node.style.lineHeight.unwrap_or(size * 1.2);
                    let align = node.style.textAlign.as_deref().unwrap_or("left");
                    for (li, line) in lines.iter().enumerate() {
                        let ly = li as f32 * lh;
                        let mut cx = match align { "center" => (w - line.width) / 2.0, "right" => w - line.width, _ => 0.0 };
                        for (c, adv) in &line.chars {
                            let (metrics, bitmap) = font.rasterize(*c, size);
                            if metrics.width > 0 && metrics.height > 0 {
                                let mut cp = Pixmap::new(metrics.width as u32, metrics.height as u32).unwrap();
                                for (i, alpha) in bitmap.iter().enumerate() {
                                    let a_norm = (*alpha as f32 / 255.0) * current_opacity;
                                    cp.data_mut()[i*4] = (color.red()*255.0*a_norm) as u8;
                                    cp.data_mut()[i*4+1] = (color.green()*255.0*a_norm) as u8;
                                    cp.data_mut()[i*4+2] = (color.blue()*255.0*a_norm) as u8;
                                    cp.data_mut()[i*4+3] = (a_norm*255.0) as u8;
                                }
                                let cy = (ly + size - metrics.height as f32 - metrics.ymin as f32) as f32;
                                pixmap.draw_pixmap(0, 0, cp.as_ref(), &PixmapPaint::default(), transform.post_translate(cx+metrics.xmin as f32, cy), None);
                            }
                            cx += adv;
                        }
                    }
                }
            }

            if let Some(children) = &node.children {
                let child_ids = taffy.children(layout_id).unwrap();
                let mut paired: Vec<_> = children.iter().zip(child_ids.iter()).collect();
                paired.sort_by_key(|(child, _)| child.style.zIndex.unwrap_or(0));

                if is_clipped {
                    let mut mask = Mask::new(pixmap.width(), pixmap.height()).unwrap();
                    mask.fill_path(&path, FillRule::Winding, true, transform);
                    let mut layer = Pixmap::new(pixmap.width(), pixmap.height()).unwrap();
                    for (child, &cid) in paired {
                        draw(taffy, child, cid, &mut layer, engine, x, y, current_opacity);
                    }
                    pixmap.draw_pixmap(0, 0, layer.as_ref(), &PixmapPaint::default(), Transform::identity(), Some(&mask));
                } else {
                    for (child, &cid) in paired {
                        draw(taffy, child, cid, pixmap, engine, x, y, current_opacity);
                    }
                }
            }
        }

        draw(&taffy, &root_node, root, &mut pixmap, self, 0.0, 0.0, 1.0);
        pixmap.data().to_vec()
    }
}