use tiny_skia::{Pixmap, Mask, Color};
use taffy::prelude::*;
use crate::types::SceneNode;
use crate::engine::EngineCore;
use crate::render::draw_scene;

pub fn draw_mask_node(node: &SceneNode, width: u32, height: u32, engine: &EngineCore, mode: &str) -> Option<Mask> {
    let mut mask_pixmap = Pixmap::new(width, height)?;
    mask_pixmap.fill(Color::TRANSPARENT);

    let mut taffy = Taffy::new();
    
    // Build the mask node's taffy handle
    let mask_id = crate::layout::build_taffy(&mut taffy, node, &engine.assets, &engine.fonts);
    
    // Create a virtual root container that fills the entire parent area.
    // This allows the 'mask_id' node to respect its own margins/positioning
    // relative to the parent's size.
    let root_style = Style {
        size: Size { 
            width: Dimension::Points(width as f32), 
            height: Dimension::Points(height as f32) 
        },
        ..Default::default()
    };
    let root = taffy.new_with_children(root_style, &[mask_id]).ok()?;

    let available_size = Size { 
        width: AvailableSpace::Definite(width as f32), 
        height: AvailableSpace::Definite(height as f32) 
    };

    taffy.compute_layout(root, available_size).ok()?;
    
    // Draw starting from the virtual root (at 0,0)
    draw_scene(&taffy, node, mask_id, &mut mask_pixmap, engine, 0.0, 0.0, 1.0);
    
    let mut mask = Mask::new(width, height)?;
    let data = mask.data_mut();
    let src = mask_pixmap.data();
    
    let mode_lc = mode.to_lowercase();
    let is_inverted = mode_lc.contains("inverted");
    let is_luminance = mode_lc.contains("luminance");

    for i in 0..data.len() {
        let (r, g, b) = (
            src[i * 4] as f32,
            src[i * 4 + 1] as f32,
            src[i * 4 + 2] as f32,
        );

        let alpha = if is_luminance {
            // Rec. 601 luma coefficients
            (0.299 * r + 0.587 * g + 0.114 * b) as u8
        } else {
            src[i * 4 + 3]
        };

        data[i] = if is_inverted { 255 - alpha } else { alpha };
    }
    Some(mask)
}
