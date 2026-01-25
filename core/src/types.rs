use serde::{Deserialize, Serialize};

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
    pub blendMode: Option<String>,
    
    // Strokes
    pub strokeLineCap: Option<String>,
    pub strokeLineJoin: Option<String>,
    pub strokeDashArray: Option<Vec<f32>>,
    pub strokeDashOffset: Option<f32>,

    // Filters
    pub grayscale: Option<f32>,
    pub brightness: Option<f32>,
    pub contrast: Option<f32>,
    pub saturation: Option<f32>,
    pub blur: Option<f32>,
    pub invert: Option<f32>,
    pub sepia: Option<f32>,

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
    pub skewX: Option<f32>,
    pub skewY: Option<f32>,
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
    // New: Allow a node to define a mask node
    pub mask: Option<Box<SceneNode>>,
}
