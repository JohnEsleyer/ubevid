import { spawn } from "bun";
import { join } from "path";
import { mkdir, exists } from "fs/promises";

/**
 * High-performance video frame manager.
 * Uses raw RGBA binary files to avoid PNG/JPEG decoding overhead.
 */
export class VideoManager {
    private cacheDir: string;
    private processed: Set<string> = new Set();

    constructor(cacheDir: string = ".amethyst/cache_v2") {
        this.cacheDir = cacheDir;
    }

    async load(id: string, path: string, projectFps: number, width: number, height: number): Promise<void> {
        if (this.processed.has(id)) return;

        const outDir = join(this.cacheDir, id);
        if (await exists(outDir)) {
            this.processed.add(id);
            return;
        }

        console.log(`🎥 Extracting high-speed raw frames for '${id}'...`);
        await mkdir(outDir, { recursive: true });

        // Extract as raw rgba streams
        const proc = spawn([
            "ffmpeg", "-i", path,
            "-vf", `fps=${projectFps},scale=${width}:${height}`,
            "-f", "image2",
            "-vcodec", "rawvideo",
            "-pix_fmt", "rgba",
            join(outDir, "%06d.raw")
        ], { stdout: "ignore", stderr: "ignore" });

        await proc.exited;
        this.processed.add(id);
    }

    async getFrame(id: string, frame: number): Promise<Uint8Array | null> {
        const fIndex = frame + 1;
        const fname = fIndex.toString().padStart(6, '0') + ".raw";
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