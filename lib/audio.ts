import { spawn } from "bun";

export class AudioAnalyzer {
  private data: Int16Array | null = null;
  private sampleRate = 8000; // Low sample rate is sufficient for visualization volume
  private isLoaded = false;

  async load(path: string) {
    if (this.isLoaded) return;
    
    console.log(`🎧 Analyzing audio waveform: ${path}...`);
    
    try {
      // Use FFmpeg to decode any audio format to raw PCM (s16le)
      const proc = spawn([
        "ffmpeg",
        "-v", "error",      // Silence output
        "-i", path,
        "-ac", "1",         // Mix to Mono
        "-ar", this.sampleRate.toString(), 
        "-f", "s16le",      // Raw signed 16-bit Little Endian
        "-c:a", "pcm_s16le",
        "-"                 // Output to stdout
      ], { 
        stdout: "pipe",
        stderr: "inherit"
      });

      const chunks: Uint8Array[] = [];
      // @ts-ignore - Bun types for spawn stdout iterator
      for await (const chunk of proc.stdout) {
        chunks.push(chunk);
      }
      
      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert bytes to Int16 samples
      this.data = new Int16Array(combined.buffer);
      this.isLoaded = true;
      console.log(`✅ Audio Analysis Complete: ${this.data.length} samples processed.`);
      
    } catch (e) {
      console.error("❌ Failed to analyze audio. Is ffmpeg installed?");
      console.error(e);
    }
  }

  /**
   * Returns the Root Mean Square (RMS) volume (0.0 to 1.0) for a specific frame.
   */
  getVolume(frame: number, fps: number): number {
    if (!this.data) return 0;
    
    const samplesPerFrame = this.sampleRate / fps;
    const start = Math.floor(frame * samplesPerFrame);
    const end = Math.floor((frame + 1) * samplesPerFrame);
    
    if (start >= this.data.length) return 0;

    let sumSquares = 0;
    let count = 0;
    
    // Calculate RMS for the window corresponding to this frame
    for (let i = start; i < end && i < this.data.length; i++) {
      // Normalize Int16 (-32768 to 32767) to Float (-1.0 to 1.0)
      const norm = this.data[i] / 32768.0; 
      sumSquares += norm * norm;
      count++;
    }
    
    // Apply a slight boost/curve to make it feel more responsive visually
    const rms = count === 0 ? 0 : Math.sqrt(sumSquares / count);
    return Math.min(1.0, rms * 1.5); 
  }
}