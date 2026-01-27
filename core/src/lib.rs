mod types;
mod utils;
mod text;
mod filters;
mod engine;
mod layout;
mod render;
mod hardware;

use wasm_bindgen::prelude::*;
use crate::engine::EngineCore;
use tiny_skia::{Pixmap, Color};
use taffy::prelude::*;

#[wasm_bindgen]
pub struct AmethystEngine {
    core: EngineCore
}

#[wasm_bindgen]
impl AmethystEngine {
    pub fn new() -> AmethystEngine {
        AmethystEngine { core: EngineCore::new() }
    }

    pub async fn get_hardware_info(&self) -> JsValue {
        let info = hardware::detect_hardware().await;
        serde_json::to_string(&info).unwrap().into()
    }
    
    pub fn load_font(&mut self, name: &str, data: &[u8]) -> Result<(), JsValue> {
        self.core.load_font(name, data).map_err(|e| JsValue::from_str(&e))
    }
    
    pub fn load_asset(&mut self, id: &str, data: &[u8]) -> Result<(), JsValue> {
        self.core.load_asset(id, data).map_err(|e| JsValue::from_str(&e))
    }

    pub fn load_asset_raw(&mut self, id: &str, data: &[u8], width: u32, height: u32) -> Result<(), JsValue> {
        self.core.load_asset_raw(id, data, width, height).map_err(|e| JsValue::from_str(e.as_str()))
    }

    pub fn measure_path(&self, d: &str) -> f32 {
        utils::calculate_path_length(d)
    }

    pub fn render(&self, json_input: &str, width: u32, height: u32) -> Vec<u8> {
        let node: types::SceneNode = serde_json::from_str(json_input).unwrap();
        let mut pixmap = Pixmap::new(width, height).unwrap();
        // Fill with transparent to ensure masks and shapes clip against an empty background
        pixmap.fill(Color::TRANSPARENT);

        let mut taffy = Taffy::new();
        let root_node = layout::build_taffy(&mut taffy, &node, &self.core.assets, &self.core.fonts);
        
        taffy.compute_layout(root_node, Size {
            width: AvailableSpace::Definite(width as f32),
            height: AvailableSpace::Definite(height as f32)
        }).unwrap();

        render::draw_scene(&taffy, &node, root_node, &mut pixmap, &self.core, 0.0, 0.0, 1.0);
        
        pixmap.data().to_vec()
    }
}