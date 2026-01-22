use wasm_bindgen::prelude::*;
use tiny_skia::{Pixmap, Paint, Transform, Color};
use serde::{Deserialize, Serialize};
use taffy::prelude::*;

// --- 1. JSON Schema (Fixed for camelCase) ---
#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")] // <--- THIS IS THE FIX
pub struct SceneNode {
    pub tag: String,
    pub style: StyleConfig,
    pub children: Option<Vec<SceneNode>>,
}

#[derive(Deserialize, Serialize, Debug, Default)]
#[serde(rename_all = "camelCase")] // <--- THIS IS THE FIX
pub struct StyleConfig {
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub background_color: Option<String>, // Now accepts "backgroundColor" from JS
    pub margin: Option<f32>,
    pub padding: Option<f32>,
    pub flex: Option<f32>,
}

// --- 2. Robust Color Parser ---
fn parse_color(hex: &str) -> Color {
    let hex = hex.trim_start_matches('#');
    let (r, g, b, a) = match hex.len() {
        3 => { // Handle #RGB
            let r = u8::from_str_radix(&hex[0..1], 16).unwrap_or(0) * 17;
            let g = u8::from_str_radix(&hex[1..2], 16).unwrap_or(0) * 17;
            let b = u8::from_str_radix(&hex[2..3], 16).unwrap_or(0) * 17;
            (r, g, b, 255)
        },
        6 => { // Handle #RRGGBB
            let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
            let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
            let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
            (r, g, b, 255)
        },
        8 => { // Handle #RRGGBBAA
            let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
            let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
            let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
            let a = u8::from_str_radix(&hex[6..8], 16).unwrap_or(255);
            (r, g, b, a)
        },
        _ => (255, 0, 255, 255) // Unknown = Magenta (Debug color)
    };
    Color::from_rgba8(r, g, b, a)
}

// --- 3. Render Pipeline ---
#[wasm_bindgen]
pub fn render_frame(json_input: &str, width: u32, height: u32) -> Vec<u8> {
    // Check if JSON parses correctly
    let root_node: SceneNode = match serde_json::from_str(json_input) {
        Ok(n) => n,
        Err(_) => return vec![0; (width * height * 4) as usize], // Return empty if parse fails
    };

    let mut taffy = Taffy::new();
    
    fn build_taffy_tree(taffy: &mut Taffy, node: &SceneNode) -> Node {
        let padding = if let Some(p) = node.style.padding {
            taffy::geometry::Rect {
                left: LengthPercentage::Points(p), right: LengthPercentage::Points(p),
                top: LengthPercentage::Points(p), bottom: LengthPercentage::Points(p),
            }
        } else { taffy::geometry::Rect::zero() };

        let margin = if let Some(m) = node.style.margin {
            taffy::geometry::Rect {
                left: LengthPercentageAuto::Points(m), right: LengthPercentageAuto::Points(m),
                top: LengthPercentageAuto::Points(m), bottom: LengthPercentageAuto::Points(m),
            }
        } else { taffy::geometry::Rect::zero() };

        let style = Style {
            size: Size {
                width: node.style.width.map(|v| Dimension::Points(v)).unwrap_or(Dimension::Auto),
                height: node.style.height.map(|v| Dimension::Points(v)).unwrap_or(Dimension::Auto),
            },
            padding,
            margin,
            flex_grow: node.style.flex.unwrap_or(0.0),
            ..Default::default()
        };

        let mut child_ids = vec![];
        if let Some(children) = &node.children {
            for child in children {
                child_ids.push(build_taffy_tree(taffy, child));
            }
        }

        taffy.new_with_children(style, &child_ids).unwrap()
    }

    let root = build_taffy_tree(&mut taffy, &root_node);

    taffy.compute_layout(
        root,
        Size { width: AvailableSpace::Definite(width as f32), height: AvailableSpace::Definite(height as f32) }
    ).unwrap();

    let mut pixmap = Pixmap::new(width, height).unwrap();
    
    fn draw_node(taffy: &Taffy, node: &SceneNode, layout_id: Node, pixmap: &mut Pixmap, parent_x: f32, parent_y: f32) {
        let layout = taffy.layout(layout_id).unwrap();
        let abs_x = parent_x + layout.location.x;
        let abs_y = parent_y + layout.location.y;

        if let Some(bg_hex) = &node.style.background_color {
            let mut paint = Paint::default();
            paint.set_color(parse_color(bg_hex));
            if let Some(rect) = tiny_skia::Rect::from_xywh(abs_x, abs_y, layout.size.width, layout.size.height) {
                pixmap.fill_rect(rect, &paint, Transform::identity(), None);
            }
        }

        if let Some(children) = &node.children {
            let child_ids = taffy.children(layout_id).unwrap();
            for (i, child) in children.iter().enumerate() {
                draw_node(taffy, child, child_ids[i], pixmap, abs_x, abs_y);
            }
        }
    }

    draw_node(&taffy, &root_node, root, &mut pixmap, 0.0, 0.0);
    pixmap.data().to_vec()
}