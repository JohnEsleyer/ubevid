use tiny_skia::Pixmap;
use image::{ImageBuffer, Rgba};
use crate::types::StyleConfig;

pub fn apply_image_filters(pixmap: &mut Pixmap, style: &StyleConfig) {
    let gs = style.grayscale.unwrap_or(0.0).clamp(0.0, 1.0);
    let br = style.brightness.unwrap_or(1.0).max(0.0);
    let ct = style.contrast.unwrap_or(1.0).max(0.0);
    let sat = style.saturation.unwrap_or(1.0).max(0.0);
    let inv = style.invert.unwrap_or(0.0).clamp(0.0, 1.0);
    let sep = style.sepia.unwrap_or(0.0).clamp(0.0, 1.0);
    let blur_radius = style.blur.unwrap_or(0.0).max(0.0);

    let has_color_matrix = gs != 0.0 || br != 1.0 || ct != 1.0 || sat != 1.0 || inv != 0.0 || sep != 0.0;

    if has_color_matrix {
        let data = pixmap.data_mut();
        for i in (0..data.len()).step_by(4) {
            let alpha = data[i+3];
            if alpha == 0 { continue; }
            let a_f = alpha as f32 / 255.0;
            
            // Un-premultiply
            let mut r = (data[i] as f32 / 255.0) / a_f;
            let mut g = (data[i+1] as f32 / 255.0) / a_f;
            let mut b = (data[i+2] as f32 / 255.0) / a_f;

            // 1. Grayscale & Saturation
            let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            let sat_r = lum * (1.0 - sat) + r * sat;
            let sat_g = lum * (1.0 - sat) + g * sat;
            let sat_b = lum * (1.0 - sat) + b * sat;

            r = sat_r * (1.0 - gs) + lum * gs;
            g = sat_g * (1.0 - gs) + lum * gs;
            b = sat_b * (1.0 - gs) + lum * gs;

            // 2. Contrast
            if ct != 1.0 {
                r = (r - 0.5) * ct + 0.5;
                g = (g - 0.5) * ct + 0.5;
                b = (b - 0.5) * ct + 0.5;
            }

            // 3. Brightness
            r *= br; g *= br; b *= br;

            // 4. Invert
            if inv > 0.0 {
                r = r * (1.0 - inv) + (1.0 - r) * inv;
                g = g * (1.0 - inv) + (1.0 - g) * inv;
                b = b * (1.0 - inv) + (1.0 - b) * inv;
            }

            // 5. Sepia
            if sep > 0.0 {
                let sr = (r * 0.393) + (g * 0.769) + (b * 0.189);
                let sg = (r * 0.349) + (g * 0.686) + (b * 0.168);
                let sb = (r * 0.272) + (g * 0.534) + (b * 0.131);
                r = r * (1.0 - sep) + sr * sep;
                g = g * (1.0 - sep) + sg * sep;
                b = b * (1.0 - sep) + sb * sep;
            }

            // Re-premultiply and clamp
            data[i] = ((r * a_f * 255.0).clamp(0.0, 255.0)) as u8;
            data[i+1] = ((g * a_f * 255.0).clamp(0.0, 255.0)) as u8;
            data[i+2] = ((b * a_f * 255.0).clamp(0.0, 255.0)) as u8;
        }
    }

    if blur_radius > 0.0 {
        let w = pixmap.width();
        let h = pixmap.height();
        if let Some(img_buffer) = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(w, h, pixmap.data().to_vec()) {
            let blurred = image::imageops::blur(&img_buffer, blur_radius);
            let data = pixmap.data_mut();
            data.copy_from_slice(blurred.as_raw());
        }
    }
}