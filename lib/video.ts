import { spawn } from "bun";
import { join } from "path";
import { mkdir, exists } from "fs/promises";

export class VideoManager {
    private cacheDir: string;
    private processed: Set<string> = new Set();
    private videoInfo: Record<string, { frameCount: number, fps: number }> = {};

    constructor(cacheDir: string = ".ubevid/cache") {
        this.cacheDir = cacheDir;
    }

    async load(id: string, path: string, projectFps: number): Promise<void> {
        if (this.processed.has(id)) return;

        const outDir = join(this.cacheDir, id);
        
        // Simple check: if directory exists and has files, assume processed.
        // In production, we'd check a manifest or hash.
        if (await exists(outDir)) {
             // For now, assume if dir exists, it's done.
            console.log(`🎥 Video '${id}' found in cache.`);
            this.processed.add(id);
            return;
        }

        console.log(`⏳ Processing video '${id}' (Extracting frames at ${projectFps}fps)...`);
        await mkdir(outDir, { recursive: true });

        // Extract frames as PNGs
        const proc = spawn([
            "ffmpeg",
            "-i", path,
            "-vf", `fps=${projectFps}`,
            "-q:v", "2", // High quality JPEG could be faster, but PNG is lossless. Let's use PNG for quality.
            join(outDir, "%06d.png")
        ], { 
            stdout: "ignore", 
            stderr: "ignore" 
        });

        await proc.exited;
        if (proc.exitCode !== 0) {
            console.error(`❌ FFmpeg failed to process video '${id}'`);
        } else {
            console.log(`✅ Video '${id}' processed.`);
            this.processed.add(id);
        }
    }

    async getFrame(id: string, frame: number): Promise<Uint8Array | null> {
        // FFmpeg extraction usually starts at 1
        const fIndex = frame + 1;
        const fname = fIndex.toString().padStart(6, '0') + ".png";
        const path = join(this.cacheDir, id, fname);
        
        try {
            const file = Bun.file(path);
            if (await file.exists()) {
                return new Uint8Array(await file.arrayBuffer());
            }
        } catch (e) {}
        
        return null;
    }
}
