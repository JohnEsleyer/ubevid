use wasm_bindgen::prelude::*;
use tiny_skia::{Pixmap, Paint, Transform, Color, PixmapPaint, PathBuilder, FillRule, FilterQuality};
use serde::{Deserialize, Serialize};
use taffy::prelude::*;
use fontdue::{Font, FontSettings};
use std::collections::HashMap;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SceneNode {
    pub tag: String,
    pub text: Option<String>,
    pub src: Option<String>,
    pub style: StyleConfig,
    pub children: Option<Vec<SceneNode>>,
}

#[derive(Deserialize, Serialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct StyleConfig {
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub flex: Option<f32>,
    pub flexDirection: Option<String>, 
    pub justifyContent: Option<String>,
    pub alignItems: Option<String>,
    pub margin: Option<f32>,
    pub padding: Option<f32>,
    pub position: Option<String>,
    pub top: Option<f32>,
    pub left: Option<f32>,
    pub right: Option<f32>,
    pub bottom: Option<f32>,
    pub backgroundColor: Option<String>,
    pub borderRadius: Option<f32>,
    pub opacity: Option<f32>,
    pub color: Option<String>,
    pub fontSize: Option<f32>,
    pub fontFamily: Option<String>,
    pub textAlign: Option<String>, // "left" | "center" | "right"
    pub lineHeight: Option<f32>,
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
                    left: LengthPercentageAuto::Points(node.style.margin.unwrap_or(0.0)),
                    right: LengthPercentageAuto::Points(node.style.margin.unwrap_or(0.0)),
                    top: LengthPercentageAuto::Points(node.style.margin.unwrap_or(0.0)),
                    bottom: LengthPercentageAuto::Points(node.style.margin.unwrap_or(0.0)),
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
        
        fn draw(taffy: &Taffy, node: &SceneNode, layout_id: Node, pixmap: &mut Pixmap, engine: &UbeEngine, parent_x: f32, parent_y: f32) {
            let layout = taffy.layout(layout_id).unwrap();
            let x = parent_x + layout.location.x;
            let y = parent_y + layout.location.y;
            let w = layout.size.width;
            let h = layout.size.height;

            let mut transform = Transform::from_translate(x, y);
            if let Some(r) = node.style.rotate {
                let cx = w / 2.0; let cy = h / 2.0;
                transform = transform.pre_translate(cx, cy).pre_rotate(r).pre_translate(-cx, -cy);
            }
            if let Some(s) = node.style.scale {
                let cx = w / 2.0; let cy = h / 2.0;
                transform = transform.pre_translate(cx, cy).pre_scale(s, s).pre_translate(-cx, -cy);
            }

            let opacity = node.style.opacity.unwrap_or(1.0);

            if let Some(bg) = &node.style.backgroundColor {
                let mut paint = Paint::default();
                let mut color = parse_color(bg);
                color.set_alpha(color.alpha() * opacity);
                paint.set_color(color);
                
                if let Some(radius) = node.style.borderRadius {
                    let mut pb = PathBuilder::new();
                    let r = radius.min(w / 2.0).min(h / 2.0);
                    pb.move_to(r, 0.0); pb.line_to(w - r, 0.0); pb.quad_to(w, 0.0, w, r);
                    pb.line_to(w, h - r); pb.quad_to(w, h, w - r, h); pb.line_to(r, h);
                    pb.quad_to(0.0, h, 0.0, h - r); pb.line_to(0.0, r); pb.quad_to(0.0, 0.0, r, 0.0);
                    pb.close();
                    if let Some(path) = pb.finish() { pixmap.fill_path(&path, &paint, FillRule::Winding, transform, None); }
                } else if let Some(rect) = tiny_skia::Rect::from_xywh(0.0, 0.0, w, h) {
                    pixmap.fill_rect(rect, &paint, transform, None);
                }
            }

            if node.tag == "image" {
                if let Some(src) = &node.src {
                    if let Some(img_pixmap) = engine.assets.get(src) {
                        let mut img_paint = PixmapPaint::default();
                        img_paint.opacity = opacity;
                        img_paint.quality = FilterQuality::Bilinear;
                        let sx = w / img_pixmap.width() as f32;
                        let sy = h / img_pixmap.height() as f32;
                        let img_transform = transform.pre_scale(sx, sy);
                        pixmap.draw_pixmap(0, 0, img_pixmap.as_ref(), &img_paint, img_transform, None);
                    }
                }
            }

            if let Some(text_content) = &node.text {
                let font_name = node.style.fontFamily.as_deref().unwrap_or("default");
                let font_opt = engine.fonts.get(font_name).or_else(|| engine.fonts.values().next());

                if let Some(font) = font_opt {
                    let size = node.style.fontSize.unwrap_or(32.0);
                    let color = parse_color(node.style.color.as_deref().unwrap_or("#ffffff"));
                    let max_width = w.max(1.0); // Safety floor

                    // Word-based Wrapping Logic
                    let mut lines: Vec<TextLine> = vec![TextLine { chars: vec![], width: 0.0 }];
                    let words = text_content.split(' ');

                    for (i, word) in words.enumerate() {
                        let word_with_space = if i == 0 { word.to_string() } else { format!(" {}", word) };
                        let mut word_width = 0.0;
                        let mut word_chars = vec![];

                        for c in word_with_space.chars() {
                            let adv = font.metrics(c, size).advance_width;
                            word_chars.push((c, adv));
                            word_width += adv;
                        }

                        let line = lines.last_mut().unwrap();
                        if line.width + word_width > max_width && !line.chars.is_empty() {
                            // Start new line, trim leading space
                            let trimmed_chars: Vec<(char, f32)> = word_chars.into_iter().skip(if i > 0 { 1 } else { 0 }).collect();
                            let trimmed_width: f32 = trimmed_chars.iter().map(|(_, a)| a).sum();
                            lines.push(TextLine { chars: trimmed_chars, width: trimmed_width });
                        } else {
                            line.chars.extend(word_chars);
                            line.width += word_width;
                        }
                    }

                    let line_height = node.style.lineHeight.unwrap_or(size * 1.2);
                    let align = node.style.textAlign.as_deref().unwrap_or("left");

                    for (line_idx, line) in lines.iter().enumerate() {
                        let line_y = line_idx as f32 * line_height;
                        
                        // Calculate Horizontal Alignment Offset
                        let mut current_x = match align {
                            "center" => (max_width - line.width) / 2.0,
                            "right" => max_width - line.width,
                            _ => 0.0,
                        };

                        for (c, advance) in &line.chars {
                            let (metrics, bitmap) = font.rasterize(*c, size);
                            if metrics.width > 0 && metrics.height > 0 {
                                let mut char_pixmap = Pixmap::new(metrics.width as u32, metrics.height as u32).unwrap();
                                for (i, alpha) in bitmap.iter().enumerate() {
                                    let pixel_idx = i * 4;
                                    let a_norm = (*alpha as f32 / 255.0) * opacity;
                                    char_pixmap.data_mut()[pixel_idx]     = (color.red()   * 255.0 * a_norm) as u8;
                                    char_pixmap.data_mut()[pixel_idx + 1] = (color.green() * 255.0 * a_norm) as u8;
                                    char_pixmap.data_mut()[pixel_idx + 2] = (color.blue()  * 255.0 * a_norm) as u8;
                                    char_pixmap.data_mut()[pixel_idx + 3] = (a_norm * 255.0) as u8;
                                }
                                let char_y = (line_y + size - metrics.height as f32 - metrics.ymin as f32) as f32;
                                let t_char = transform.post_translate(current_x + metrics.xmin as f32, char_y);
                                pixmap.draw_pixmap(0, 0, char_pixmap.as_ref(), &PixmapPaint::default(), t_char, None);
                            }
                            current_x += advance;
                        }
                    }
                }
            }

            if let Some(children) = &node.children {
                let child_ids = taffy.children(layout_id).unwrap();
                for (i, child) in children.iter().enumerate() {
                    draw(taffy, child, child_ids[i], pixmap, engine, x, y);
                }
            }
        }

        draw(&taffy, &root_node, root, &mut pixmap, self, 0.0, 0.0);
        pixmap.data().to_vec()
    }
}