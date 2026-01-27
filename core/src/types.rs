use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(untagged)]
pub enum DimensionProp {
    Points(f32),
    Percent(String),
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HardwareInfo {
    pub mode: String,
    pub device: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GradientConfig {
    pub r#type: Option<String>,
    pub colors: Vec<String>,
    pub stops: Option<Vec<f32>>,
    pub angle: Option<f32>,
}

#[derive(Deserialize, Serialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StyleConfig {
    pub width: Option<DimensionProp>,
    pub height: Option<DimensionProp>,
    pub aspect_ratio: Option<f32>,
    pub flex: Option<f32>,
    pub flex_direction: Option<String>, 
    pub justify_content: Option<String>,
    pub align_items: Option<String>,
    pub margin: Option<DimensionProp>,
    pub margin_top: Option<DimensionProp>,
    pub margin_bottom: Option<DimensionProp>,
    pub margin_left: Option<DimensionProp>,
    pub margin_right: Option<DimensionProp>,
    pub padding: Option<DimensionProp>,
    pub position: Option<String>,
    pub top: Option<DimensionProp>,
    pub left: Option<DimensionProp>,
    pub right: Option<DimensionProp>,
    pub bottom: Option<DimensionProp>,
    pub z_index: Option<i32>,
    pub overflow: Option<String>,
    pub background_color: Option<String>,
    pub background_gradient: Option<GradientConfig>,
    pub border_radius: Option<f32>,
    pub border_top_left_radius: Option<f32>,
    pub border_top_right_radius: Option<f32>,
    pub border_bottom_left_radius: Option<f32>,
    pub border_bottom_right_radius: Option<f32>,
    pub border_color: Option<String>,
    pub border_width: Option<f32>,
    pub opacity: Option<f32>,
    pub blend_mode: Option<String>,
    pub mask_mode: Option<String>, 
    pub stroke_line_cap: Option<String>,
    pub stroke_line_join: Option<String>,
    pub stroke_dash_array: Option<Vec<f32>>,
    pub stroke_dash_offset: Option<f32>,
    pub grayscale: Option<f32>,
    pub brightness: Option<f32>,
    pub contrast: Option<f32>,
    pub saturation: Option<f32>,
    pub blur: Option<f32>,
    pub invert: Option<f32>,
    pub sepia: Option<f32>,
    pub shadow_color: Option<String>,
    pub shadow_blur: Option<f32>,
    pub shadow_offset_x: Option<f32>,
    pub shadow_offset_y: Option<f32>,
    pub color: Option<String>,
    pub font_size: Option<f32>,
    pub font_family: Option<String>,
    pub text_align: Option<String>,
    pub line_height: Option<f32>,
    pub letter_spacing: Option<f32>,
    pub object_fit: Option<String>,
    pub rotate: Option<f32>,
    pub scale: Option<f32>,
    pub skew_x: Option<f32>,
    pub skew_y: Option<f32>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SceneNode {
    pub tag: String,
    pub text: Option<String>,
    pub src: Option<String>,
    pub d: Option<String>,
    pub style: StyleConfig,
    pub children: Option<Vec<SceneNode>>,
    pub mask: Option<Box<SceneNode>>,
}
