use fontdue::{Font, Metrics};

pub struct TextLine {
    pub chars: Vec<(char, f32)>,
    pub width: f32,
}

#[derive(Hash, Eq, PartialEq)]
pub struct GlyphKey {
    pub font: String,
    pub c: char,
    pub size: u32,
}

pub struct CachedGlyph {
    pub metrics: Metrics,
    pub bitmap: Vec<u8>,
}

pub fn compute_text_lines(
    font: &Font, 
    text: &str, 
    font_size: f32, 
    letter_spacing: f32, 
    max_width: Option<f32>
) -> Vec<TextLine> {
    let mut lines: Vec<TextLine> = Vec::new();
    let wrap_width = max_width.unwrap_or(f32::MAX);

    for raw_line in text.lines() {
        let mut current_line = TextLine { chars: vec![], width: 0.0 };
        for (i, word) in raw_line.split(' ').enumerate() {
            let word_with_space = if i == 0 { word.to_string() } else { format!(" {}", word) };
            let mut ww = 0.0;
            let mut wc = vec![];

            for c in word_with_space.chars() {
                let adv = font.metrics(c, font_size).advance_width + letter_spacing;
                wc.push((c, adv));
                ww += adv;
            }

            if current_line.width + ww > wrap_width && !current_line.chars.is_empty() {
                lines.push(current_line);
                let trimmed: Vec<(char, f32)> = wc.into_iter().skip(if i > 0 { 1 } else { 0 }).collect();
                let tw: f32 = trimmed.iter().map(|(_, a)| a).sum();
                current_line = TextLine { chars: trimmed, width: tw };
            } else {
                current_line.chars.extend(wc);
                current_line.width += ww;
            }
        }
        lines.push(current_line);
    }
    lines
}
