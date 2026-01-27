import { renderSingleFrame, render } from "./engine.js";
import { getPreviewHTML } from "./server-ui.js";
import type { RenderConfig, SceneNode } from "./types.js";

export function startPreview<T>(
  sceneComponent: (props: T) => SceneNode, 
  config: RenderConfig,
  props: T = {} as T
) {
  const port = 3000;
  
  console.log(`\n🟣 amethyst Preview Server`);
  console.log(`📡 Local: http://localhost:${port}`);
  console.log(`🌐 Remote: Detected automatically via relative paths\n`);

  Bun.serve({
    port,
    hostname: "0.0.0.0",
    async fetch(req) {
      const url = new URL(req.url);
      
      try {
        // 1. Export Route: Trigger full FFmpeg render
        if (url.searchParams.has("export")) {
          console.log("🎬 Export requested via Browser...");
          const timestamp = Date.now();
          const tempFile = `export-${timestamp}.mp4`;
          
          await render(sceneComponent, config, tempFile, props);
          
          const file = Bun.file(tempFile);
          return new Response(file, {
            headers: { 
                "Content-Type": "video/mp4",
                "Content-Disposition": `attachment; filename="amethyst-render-${timestamp}.mp4"`,
                "Cache-Control": "no-cache"
            },
          });
        }

        // 2. Frame Route: Return RGBA buffer for canvas
        if (url.searchParams.has("f")) {
          const frame = parseInt(url.searchParams.get("f") || "0", 10);
          const rgbaBuffer = await renderSingleFrame(sceneComponent, config, frame, props);
          return new Response(rgbaBuffer, { 
            headers: { 
              "Content-Type": "application/octet-stream",
              "Cache-Control": "no-cache" 
            } 
          });
        }
      } catch (e: any) {
        console.error("❌ Preview Server Error:", e);
        return new Response(`Server Error: ${e.message}`, { status: 500 });
      }

      // 3. UI Route: Return the HTML interface
      const totalFrames = config.fps * config.duration;
      return new Response(getPreviewHTML(config, totalFrames), { 
        headers: { "Content-Type": "text/html" } 
      });
    },
  });
}