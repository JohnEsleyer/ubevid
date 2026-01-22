use wasm_bindgen::prelude::*;
use tiny_skia::{Pixmap, Paint, Transform, Color, PixmapMut};
use serde::{Deserialize, Serialize};
use taffy::prelude::*;

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SceneNode {
    pub tag: String,
    pub style: StyleConfig,
    pub children: Option<Vec<SceneNode>>,
}

#[derive(Deserialize, Serialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct StyleConfig {
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub backgroundColor: Option<String>,
    pub margin: Option<f32>,
    pub padding: Option<f32>,
    pub flex: Option<f32>,
    // New Flexbox Properties
    pub flexDirection: Option<String>,   // "row", "column"
    pub justifyContent: Option<String>,  // "center", "spaceBetween", etc.
    pub alignItems: Option<String>,      // "center", "flexStart", etc.
    // New Transform Properties
    pub rotate: Option<f32>,             // degrees
    pub scale: Option<f32>,
}

fn parse_color(hex: &str) -> Color {
    let hex = hex.trim_start_matches('#');
    let (r, g, b, a) = match hex.len() {
        3 => {
            let r = u8::from_str_radix(&hex[0..1], 16).unwrap_or(0) * 17;
            let g = u8::from_str_radix(&hex[1..2], 16).unwrap_or(0) * 17;
            let b = u8::from_str_radix(&hex[2..3], 16).unwrap_or(0) * 17;
            (r, g, b, 255)
        },
        6 => {
            let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
            let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
            let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
            (r, g, b, 255)
        },
        _ => (255, 0, 255, 255)
    };
    Color::from_rgba8(r, g, b, a)
}

#[wasm_bindgen]
pub fn render_frame(json_input: &str, width: u32, height: u32) -> Vec<u8> {
    let root_node: SceneNode = serde_json::from_str(json_input).unwrap();
    let mut taffy = Taffy::new();
    
    fn build_taffy_tree(taffy: &mut Taffy, node: &SceneNode) -> Node {
        let style = Style {
            size: Size {
                width: node.style.width.map(|v| Dimension::Points(v)).unwrap_or(Dimension::Auto),
                height: node.style.height.map(|v| Dimension::Points(v)).unwrap_or(Dimension::Auto),
            },
            flex_direction: match node.style.flexDirection.as_deref() {
                Some("column") => FlexDirection::Column,
                _ => FlexDirection::Row,
            },
            justify_content: match node.style.justifyContent.as_deref() {
                Some("center") => Some(JustifyContent::Center),
                Some("spaceBetween") => Some(JustifyContent::SpaceBetween),
                _ => None,
            },
            align_items: match node.style.alignItems.as_deref() {
                Some("center") => Some(AlignItems::Center),
                _ => None,
            },
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
    taffy.compute_layout(root, Size { 
        width: AvailableSpace::Definite(width as f32), 
        height: AvailableSpace::Definite(height as f32) 
    }).unwrap();

    let mut pixmap = Pixmap::new(width, height).unwrap();
    
    fn draw_node(taffy: &Taffy, node: &SceneNode, layout_id: Node, pixmap: &mut Pixmap, parent_x: f32, parent_y: f32) {
        let layout = taffy.layout(layout_id).unwrap();
        let abs_x = parent_x + layout.location.x;
        let abs_y = parent_y + layout.location.y;

        if let Some(bg_hex) = &node.style.backgroundColor {
            let mut paint = Paint::default();
            paint.set_color(parse_color(bg_hex));

            // Apply Transformations
            let mut ts = Transform::from_translate(abs_x + layout.size.width/2.0, abs_y + layout.size.height/2.0);
            if let Some(deg) = node.style.rotate {
                ts = ts.pre_rotate(deg);
            }
            if let Some(s) = node.style.scale {
                ts = ts.pre_scale(s, s);
            }
            // Move back to top-left after rotation/scale
            ts = ts.pre_translate(-layout.size.width/2.0, -layout.size.height/2.0);

            if let Some(rect) = tiny_skia::Rect::from_xywh(0.0, 0.0, layout.size.width, layout.size.height) {
                pixmap.fill_rect(rect, &paint, ts, None);
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