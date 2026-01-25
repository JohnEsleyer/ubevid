use taffy::prelude::*;
use taffy::node::MeasureFunc;
use std::collections::HashMap;
use std::sync::Arc;
use fontdue::Font;
use tiny_skia::Pixmap;

use crate::types::SceneNode;
use crate::text::compute_text_lines;

pub fn build_taffy(
    taffy: &mut Taffy, 
    node: &SceneNode, 
    assets: &HashMap<String, Pixmap>, 
    fonts: &HashMap<String, Arc<Font>>
) -> Node {
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
        aspect_ratio: node.style.aspect_ratio,
        position: match node.style.position.as_deref() { Some("absolute") => Position::Absolute, _ => Position::Relative },
        flex_grow: node.style.flex.unwrap_or(0.0),
        flex_direction: match node.style.flex_direction.as_deref() { Some("column") => FlexDirection::Column, _ => FlexDirection::Row },
        justify_content: Some(match node.style.justify_content.as_deref() { Some("center") => JustifyContent::Center, Some("spaceBetween") => JustifyContent::SpaceBetween, Some("flexEnd") => JustifyContent::FlexEnd, _ => JustifyContent::FlexStart }),
        align_items: Some(match node.style.align_items.as_deref() { Some("center") => AlignItems::Center, Some("flexEnd") => AlignItems::FlexEnd, _ => AlignItems::FlexStart }),
        padding: Rect {
            left: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
            right: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
            top: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
            bottom: LengthPercentage::Points(node.style.padding.unwrap_or(0.0)),
        },
        margin: Rect {
            left: LengthPercentageAuto::Points(node.style.margin_left.or(node.style.margin).unwrap_or(0.0)),
            right: LengthPercentageAuto::Points(node.style.margin_right.or(node.style.margin).unwrap_or(0.0)),
            top: LengthPercentageAuto::Points(node.style.margin_top.or(node.style.margin).unwrap_or(0.0)),
            bottom: LengthPercentageAuto::Points(node.style.margin_bottom.or(node.style.margin).unwrap_or(0.0)),
        },
        inset: Rect {
            left: node.style.left.map(LengthPercentageAuto::Points).unwrap_or(LengthPercentageAuto::Auto),
            right: node.style.right.map(LengthPercentageAuto::Points).unwrap_or(LengthPercentageAuto::Auto),
            top: node.style.top.map(LengthPercentageAuto::Points).unwrap_or(LengthPercentageAuto::Auto),
            bottom: node.style.bottom.map(LengthPercentageAuto::Points).unwrap_or(LengthPercentageAuto::Auto),
        },
        ..Default::default()
    };

    if let Some(text_content_ref) = &node.text {
        let font_name = node.style.font_family.as_deref().unwrap_or("default");
        let font_opt = fonts.get(font_name).or_else(|| fonts.values().next()).cloned();
        
        if let Some(font) = font_opt {
            let text_content = String::from(text_content_ref);
            let font_size = node.style.font_size.unwrap_or(32.0);
            let letter_spacing = node.style.letter_spacing.unwrap_or(0.0);
            let line_height = node.style.line_height.unwrap_or(font_size * 1.2);

            return taffy.new_leaf_with_measure(style, MeasureFunc::Boxed(Box::new(move |_known_dims, available_space| {
                let max_width = match available_space.width {
                    AvailableSpace::Definite(px) => Some(px),
                    AvailableSpace::MinContent => Some(0.0),
                    AvailableSpace::MaxContent => None,
                };

                let lines = compute_text_lines(&font, &text_content, font_size, letter_spacing, max_width);
                
                let width = lines.iter().map(|l| l.width).fold(0.0, f32::max);
                let height = lines.len() as f32 * line_height;

                Size { width, height }
            }))).unwrap();
        }
    }

    let mut child_ids = vec![];
    if let Some(children) = &node.children {
        for child in children { child_ids.push(build_taffy(taffy, child, assets, fonts)); }
    }
    taffy.new_with_children(style, &child_ids).unwrap()
}