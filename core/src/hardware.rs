use crate::types::HardwareInfo;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

pub async fn detect_hardware() -> HardwareInfo {
    // Check if we are in a browser/engine environment with WebGPU support
    let has_gpu_support = {
        let global = js_sys::global();
        let navigator_prop = JsValue::from_str("navigator");
        let gpu_prop = JsValue::from_str("gpu");

        if let Ok(navigator) = js_sys::Reflect::get(&global, &navigator_prop) {
             if !navigator.is_undefined() {
                 if let Ok(gpu) = js_sys::Reflect::get(&navigator, &gpu_prop) {
                     !gpu.is_undefined()
                 } else {
                     false
                 }
             } else {
                 false
             }
        } else {
            false
        }
    };

    if !has_gpu_support {
        return HardwareInfo {
            mode: "cpu".to_string(),
            device: "TinySkia / Software (Headless)".to_string(),
        };
    }

    let instance = wgpu::Instance::default();
    
    let adapter = instance
        .request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            force_fallback_adapter: false,
            compatible_surface: None,
        })
        .await;

    match adapter {
        Some(a) => {
            let info = a.get_info();
            HardwareInfo {
                mode: "gpu".to_string(),
                device: format!("{:?} - {}", info.backend, info.name),
            }
        }
        None => HardwareInfo {
            mode: "cpu".to_string(),
            device: "TinySkia / Software (No GPU Adapter Found)".to_string(),
        },
    }
}