use tiny_skia::*;
use crate::types::SceneNode;
use crate::engine::EngineCore;

pub fn draw_image(
    pixmap: &mut Pixmap, 
    node: &SceneNode, 
    _path: &Path, 
    transform: Transform, 
    engine: &EngineCore,
    w: f32, 
    h: f32,
    opacity: f32
) {
    if let Some(src) = &node.src {
        if let Some(img_pixmap) = engine.assets.get(src) {
            let mut paint = PixmapPaint::default();
            paint.opacity = opacity;
            paint.quality = FilterQuality::Bilinear;

            let sx = w / img_pixmap.width() as f32;
            let sy = h / img_pixmap.height() as f32;
            let ts = transform.pre_scale(sx, sy);

            pixmap.draw_pixmap(0, 0, img_pixmap.as_ref(), &paint, ts, None);
        }
    }
}