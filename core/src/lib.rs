use wasm_bindgen::prelude::*;
use tiny_skia::{Pixmap, Paint, Transform, Color, PixmapPaint};
use serde::{Deserialize, Serialize};
use taffy::prelude::*;
use fontdue::{Font, FontSettings};
use std::collections::HashMap;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

static FONT_DATA: &[u8] = include_bytes!("../../assets/Roboto-Regular.ttf"); 

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
    pub backgroundColor: Option<String>,
    pub color: Option<String>,
    pub fontSize: Option<f32>,
    pub margin: Option<f32>,
    pub padding: Option<f32>,
    pub flex: Option<f32>,
    pub flexDirection: Option<String>, 
    pub justifyContent: Option<String>,
    pub alignItems: Option<String>,
    pub rotate: Option<f32>,
    pub scale: Option<f32>,
    pub opacity: Option<f32>,
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
        6 => (
            u8::from_str_radix(&hex[0..2], 16).unwrap_or(0),
            u8::from_str_radix(&hex[2..4], 16).unwrap_or(0),
            u8::from_str_radix(&hex[4..6], 16).unwrap_or(0),
            255
        ),
        8 => (
            u8::from_str_radix(&hex[0..2], 16).unwrap_or(0),
            u8::from_str_radix(&hex[2..4], 16).unwrap_or(0),
            u8::from_str_radix(&hex[4..6], 16).unwrap_or(0),
            u8::from_str_radix(&hex[6..8], 16).unwrap_or(255)
        ),
        _ => (0, 0, 0, 255)
    };
    Color::from_rgba8(r, g, b, a)
}

#[wasm_bindgen]
pub struct UbeEngine {
    font: Font,
    assets: HashMap<String, Pixmap>, 
}

#[wasm_bindgen]
impl UbeEngine {
    pub fn new() -> UbeEngine {
        let font = Font::from_bytes(FONT_DATA, FontSettings::default()).unwrap();
        UbeEngine {
            font,
            assets: HashMap::new(),
        }
    }

    pub fn load_asset(&mut self, id: &str, data: &[u8]) -> Result<(), JsValue> {
        let img = image::load_from_memory(data)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
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
            let mut w = node.style.width.map(|v| Dimension::Points(v)).unwrap_or(Dimension::Auto);
            let mut h = node.style.height.map(|v| Dimension::Points(v)).unwrap_or(Dimension::Auto);

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
                margin: Rect {
                    left: LengthPercentageAuto::Points(node.style.margin.unwrap_or(0.0)),
                    right: LengthPercentageAuto::Points(node.style.margin.unwrap_or(0.0)),
                    top: LengthPercentageAuto::Points(node.style.margin.unwrap_or(0.0)),
                    bottom: LengthPercentageAuto::Points(node.style.margin.unwrap_or(0.0)),
                },
                padding: Rect {
                    left: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
                    right: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
                    top: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
                    bottom: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
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
            parent_y: f32
        ) {
            let layout = taffy.layout(layout_id).unwrap();
            let x = parent_x + layout.location.x;
            let y = parent_y + layout.location.y;
            
            let mut transform = Transform::from_translate(x, y);
            
            if let Some(r) = node.style.rotate {
                let cx = layout.size.width / 2.0;
                let cy = layout.size.height / 2.0;
                transform = transform.pre_translate(cx, cy).pre_rotate(r).pre_translate(-cx, -cy);
            }
            
            if let Some(s) = node.style.scale {
                let cx = layout.size.width / 2.0;
                let cy = layout.size.height / 2.0;
                transform = transform.pre_translate(cx, cy).pre_scale(s, s).pre_translate(-cx, -cy);
            }

            let opacity = node.style.opacity.unwrap_or(1.0);

            // 1. Draw Background / Rect
            if let Some(bg) = &node.style.backgroundColor {
                let mut paint = Paint::default();
                let mut color = parse_color(bg);
                color.set_alpha(color.alpha() * opacity);
                paint.set_color(color);
                
                if let Some(r) = tiny_skia::Rect::from_xywh(0.0, 0.0, layout.size.width, layout.size.height) {
                    pixmap.fill_rect(r, &paint, transform, None);
                }
            }

            // 2. Draw Circle
            if node.tag == "circle" {
                let mut paint = Paint::default();
                if let Some(bg) = &node.style.backgroundColor {
                    let mut color = parse_color(bg);
                    color.set_alpha(color.alpha() * opacity);
                    paint.set_color(color);
                }

                let radius = layout.size.width.min(layout.size.height) / 2.0;
                let mut path_builder = tiny_skia::PathBuilder::new();
                path_builder.push_circle(radius, radius, radius);
                
                if let Some(path) = path_builder.finish() {
                    pixmap.fill_path(&path, &paint, tiny_skia::FillRule::Winding, transform, None);
                }
            }

            // 3. Draw Image
            if node.tag == "image" {
                if let Some(src) = &node.src {
                    if let Some(img_pixmap) = engine.assets.get(src) {
                        let mut img_paint = PixmapPaint::default();
                        img_paint.opacity = opacity;
                        img_paint.quality = tiny_skia::FilterQuality::Bilinear;
                        
                        let sx = layout.size.width / img_pixmap.width() as f32;
                        let sy = layout.size.height / img_pixmap.height() as f32;
                        let img_transform = transform.pre_scale(sx, sy);

                        pixmap.draw_pixmap(0, 0, img_pixmap.as_ref(), &img_paint, img_transform, None);
                    }
                }
            }

            // 4. Draw Text
            if let Some(text_content) = &node.text {
                let size = node.style.fontSize.unwrap_or(32.0);
                let color = parse_color(node.style.color.as_deref().unwrap_or("#ffffff"));
                let mut curr_x = 0.0;

                for c in text_content.chars() {
                    let (metrics, bitmap) = engine.font.rasterize(c, size);
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
                        
                        let char_y = (size as i32 - metrics.height as i32 - metrics.ymin) as f32;
                        let t_char = transform.post_translate(curr_x + metrics.xmin as f32, char_y);
                        pixmap.draw_pixmap(0, 0, char_pixmap.as_ref(), &PixmapPaint::default(), t_char, None);
                    }
                    curr_x += metrics.advance_width;
                }
            }

            // 5. Recurse Children
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