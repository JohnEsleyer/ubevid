mod types;
mod utils;
mod text;
mod filters;
mod engine;
mod layout;
mod render;

use wasm_bindgen::prelude::*;
use taffy::prelude::*;
use tiny_skia::Pixmap;
use crate::engine::EngineCore;
use crate::types::{SceneNode, HardwareInfo};
use crate::utils::calculate_path_length;

#[wasm_bindgen]
pub struct AmethystEngine {
    core: EngineCore
}

#[wasm_bindgen]
impl AmethystEngine {
    pub fn new() -> AmethystEngine {
        AmethystEngine { core: EngineCore::new() }
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

    pub fn get_hardware_info(&self) -> JsValue {
        // Currently defaulting to CPU/TinySkia as we prepare the WGPU backend
        let info = HardwareInfo {
            mode: "cpu".to_string(),
            device: "TinySkia / Software".to_string(),
        };
        serde_json::to_string(&info).unwrap().into()
    }

    pub fn render(&self, json_input: &str, width: u32, height: u32) -> Vec<u8> {
        let root_node: SceneNode = serde_json::from_str(json_input).unwrap();
        let mut taffy = Taffy::new();
        
        let root = layout::build_taffy(&mut taffy, &root_node, &self.core.assets, &self.core.fonts);
        taffy.compute_layout(root, Size { 
            width: AvailableSpace::Definite(width as f32), 
            height: AvailableSpace::Definite(height as f32) 
        }).unwrap();

        let mut pixmap = Pixmap::new(width, height).unwrap();
        render::draw_scene(&taffy, &root_node, root, &mut pixmap, &self.core, 0.0, 0.0, 1.0);
        
        pixmap.data().to_vec()
    }

    pub fn measure_path(&self, d: &str) -> f32 {
        calculate_path_length(d)
    }
}