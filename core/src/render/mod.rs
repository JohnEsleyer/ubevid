mod primitives;
mod images;
mod text;
mod mask;

use tiny_skia::*;
use taffy::prelude::*;
use svgtypes::PathParser;
use crate::types::SceneNode;
use crate::utils::parse_blend_mode;
use crate::engine::EngineCore;

pub use primitives::draw_primitive;
pub use images::draw_image;
pub use text::draw_text;
pub use mask::draw_mask_node;

pub fn generate_path(node: &SceneNode, w: f32, h: f32) -> Path {
    let mut pb = PathBuilder::new();
    if let Some(d) = &node.d {
        let mut cx = 0.0; let mut cy = 0.0;
        for segment in PathParser::from(d.as_str()) {
            match segment {
                Ok(svgtypes::PathSegment::MoveTo { abs, x, y }) => { cx = if abs { x as f32 } else { cx + x as f32 }; cy = if abs { y as f32 } else { cy + y as f32 }; pb.move_to(cx, cy); },
                Ok(svgtypes::PathSegment::LineTo { abs, x, y }) => { cx = if abs { x as f32 } else { cx + x as f32 }; cy = if abs { y as f32 } else { cy + y as f32 }; pb.line_to(cx, cy); },
                Ok(svgtypes::PathSegment::ClosePath { .. }) => { pb.close(); },
                _ => {}
            }
        }
    } else if let Some(rect) = tiny_skia::Rect::from_xywh(0.0, 0.0, w, h) {
        if node.tag == "circle" || node.tag == "ellipse" {
            pb.push_oval(rect);
        } else {
            let r = node.style.border_radius.unwrap_or(0.0).min(w/2.0).min(h/2.0);
            if r > 0.0 {
                pb.move_to(r, 0.0); pb.line_to(w-r, 0.0); pb.quad_to(w, 0.0, w, r);
                pb.line_to(w, h-r); pb.quad_to(w, h, w-r, h); pb.line_to(r, h);
                pb.quad_to(0.0, h, 0.0, h-r); pb.line_to(0.0, r); pb.quad_to(0.0, 0.0, r, 0.0);
                pb.close();
            } else {
                pb.push_rect(rect);
            }
        }
    }
    pb.finish().unwrap_or_else(|| { let b = PathBuilder::new(); b.finish().unwrap() })
}

pub fn draw_scene(
    taffy: &Taffy, node: &SceneNode, layout_id: Node, pixmap: &mut Pixmap, 
    engine: &EngineCore, parent_x: f32, parent_y: f32, parent_opacity: f32
) {
    let layout = taffy.layout(layout_id).unwrap();
    let (x, y, w, h) = (parent_x + layout.location.x, parent_y + layout.location.y, layout.size.width, layout.size.height);

    let mut transform = Transform::from_translate(x, y);
    transform = transform.pre_translate(w/2.0, h/2.0);
    if let Some(r) = node.style.rotate { transform = transform.pre_rotate(r); }
    if let Some(s) = node.style.scale { transform = transform.pre_scale(s, s); }
    transform = transform.pre_translate(-w/2.0, -h/2.0);

    let current_opacity = parent_opacity * node.style.opacity.unwrap_or(1.0);
    let blend_mode = parse_blend_mode(node.style.blend_mode.as_deref().unwrap_or("normal"));
    let path = generate_path(node, w, h);

    let has_radius = node.style.border_radius.unwrap_or(0.0) > 0.0 || node.tag == "circle";
    let is_clipped = node.style.overflow.as_deref() == Some("hidden") || has_radius;

    let mut layer = Pixmap::new(pixmap.width(), pixmap.height()).unwrap();
    layer.fill(Color::TRANSPARENT);

    draw_primitive(&mut layer, node, &path, transform, 1.0, w, h);
    
    let mut content_layer = Pixmap::new(pixmap.width(), pixmap.height()).unwrap();
    content_layer.fill(Color::TRANSPARENT);

    if node.tag == "image" { draw_image(&mut content_layer, node, &path, transform, engine, w, h, 1.0); }
    if let Some(t) = &node.text { draw_text(&mut content_layer, node, t, transform, engine, w, 1.0); }
    if let Ok(child_ids) = taffy.children(layout_id) {
        if let Some(children) = &node.children {
            for (child, &cid) in children.iter().zip(child_ids.iter()) {
                draw_scene(taffy, child, cid, &mut content_layer, engine, x, y, 1.0);
            }
        }
    }

    if is_clipped {
        if let Some(mut clip_mask) = Mask::new(pixmap.width(), pixmap.height()) {
            clip_mask.fill_path(&path, FillRule::Winding, true, transform);
            layer.draw_pixmap(0, 0, content_layer.as_ref(), &PixmapPaint::default(), Transform::identity(), Some(&clip_mask));
        }
    } else {
        layer.draw_pixmap(0, 0, content_layer.as_ref(), &PixmapPaint::default(), Transform::identity(), None);
    }

    if node.style.blur.is_some() { crate::filters::apply_image_filters(&mut layer, &node.style); }

    let mut lp = PixmapPaint::default();
    lp.blend_mode = blend_mode; lp.opacity = current_opacity;
    
    let mask = if let Some(m) = &node.mask {
        draw_mask_node(m, pixmap.width(), pixmap.height(), engine, node.style.mask_mode.as_deref().unwrap_or("alpha"))
    } else { None };

    pixmap.draw_pixmap(0, 0, layer.as_ref(), &lp, Transform::identity(), mask.as_ref());
}