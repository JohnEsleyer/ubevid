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

            let iw = img_pixmap.width() as f32;
            let ih = img_pixmap.height() as f32;

            let scale_x = w / iw;
            let scale_y = h / ih;

            let (sx, sy) = match node.style.object_fit.as_deref() {
                Some("cover") => {
                    let s = scale_x.max(scale_y);
                    (s, s)
                },
                Some("contain") => {
                    let s = scale_x.min(scale_y);
                    (s, s)
                },
                _ => (scale_x, scale_y) // Default: Fill / Stretch
            };

            // Center the image within the bounding box
            let new_w = iw * sx;
            let new_h = ih * sy;
            let tx = (w - new_w) / 2.0;
            let ty = (h - new_h) / 2.0;

            // Apply translation first (to center), then scale
            let ts = transform.pre_translate(tx, ty).pre_scale(sx, sy);

            pixmap.draw_pixmap(0, 0, img_pixmap.as_ref(), &paint, ts, None);
        }
    }
}
