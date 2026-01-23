use std::collections::HashMap;
use std::sync::Arc;
use std::cell::RefCell;
use fontdue::{Font, FontSettings};
use tiny_skia::Pixmap;
use crate::text::{CachedGlyph, GlyphKey};

pub struct EngineCore {
    pub fonts: HashMap<String, Arc<Font>>,
    pub assets: HashMap<String, Pixmap>, 
    pub glyph_cache: RefCell<HashMap<GlyphKey, Arc<CachedGlyph>>>,
    pub scratch_buffer: RefCell<Vec<u8>>,
}

impl EngineCore {
    pub fn new() -> EngineCore {
        EngineCore { 
            fonts: HashMap::new(), 
            assets: HashMap::new(),
            glyph_cache: RefCell::new(HashMap::new()),
            scratch_buffer: RefCell::new(Vec::new()),
        }
    }

    pub fn load_font(&mut self, name: &str, data: &[u8]) -> Result<(), String> {
        let font = Font::from_bytes(data, FontSettings::default()).map_err(|e| e.to_string())?;
        self.fonts.insert(name.to_string(), Arc::new(font));
        Ok(())
    }

    pub fn load_asset(&mut self, id: &str, data: &[u8]) -> Result<(), String> {
        let img = image::load_from_memory(data).map_err(|e| e.to_string())?;
        let mut rgba = img.to_rgba8();
        let width = rgba.width();
        let height = rgba.height();
        for p in rgba.chunks_exact_mut(4) {
            let a = p[3] as u16;
            if a != 255 {
                p[0] = ((p[0] as u16 * a) / 255) as u8;
                p[1] = ((p[1] as u16 * a) / 255) as u8;
                p[2] = ((p[2] as u16 * a) / 255) as u8;
            }
        }
        let pixmap = Pixmap::from_vec(rgba.into_raw(), tiny_skia::IntSize::from_wh(width, height).unwrap())
            .ok_or_else(|| "Failed to create pixmap".to_string())?;
        self.assets.insert(id.to_string(), pixmap);
        Ok(())
    }

    pub fn get_glyph(&self, font_name: &str, font: &Font, c: char, size: f32) -> Arc<CachedGlyph> {
        let key = GlyphKey { font: font_name.to_string(), c, size: (size * 100.0) as u32 };
        
        if let Some(g) = self.glyph_cache.borrow().get(&key) {
            return g.clone();
        }

        let (metrics, bitmap) = font.rasterize(c, size);
        let glyph = Arc::new(CachedGlyph { metrics, bitmap });
        
        self.glyph_cache.borrow_mut().insert(key, glyph.clone());
        glyph
    }
}