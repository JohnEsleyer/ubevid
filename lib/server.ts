import { renderSingleFrame, render } from "./engine";
import type { RenderConfig, SceneNode } from "./types";

export function startPreview<T>(
  sceneComponent: (props: T) => SceneNode, 
  config: RenderConfig,
  props: T = {} as T
) {
  const port = 3000;
  
  console.log(`\n🟣 Ubevid Preview Server`);
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
          
          // Run the heavy render process
          await render(sceneComponent, config, tempFile, props);
          
          const file = Bun.file(tempFile);
          return new Response(file, {
            headers: { 
                "Content-Type": "video/mp4",
                "Content-Disposition": `attachment; filename="ubevid-render-${timestamp}.mp4"`,
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

      // 3. UI Route: The Preview Interface
      const totalFrames = config.fps * config.duration;
      
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
            <title>Ubevid Preview</title>
            <style>
                body { 
                    background: #0a0a0a; color: #eee; font-family: system-ui, -apple-system, sans-serif; 
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    min-height: 100vh; margin: 0; padding: 20px;
                }
                .stage-container { 
                    background: #000; border-radius: 12px; overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px #222;
                    margin-bottom: 30px; line-height: 0;
                }
                canvas { max-width: 90vw; max-height: 65vh; object-fit: contain; }
                
                .controls { 
                    background: #161616; padding: 24px; border-radius: 16px; 
                    width: 700px; max-width: 95vw; border: 1px solid #222;
                }
                .seeker { 
                    width: 100%; height: 6px; background: #333; border-radius: 10px; 
                    outline: none; -webkit-appearance: none; cursor: pointer; margin-bottom: 20px;
                }
                .seeker::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #8b5cf6; border-radius: 50%; cursor: pointer; border: 3px solid #161616; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
                
                .actions { display: flex; align-items: center; justify-content: space-between; }
                .btn-group { display: flex; gap: 12px; }
                
                .btn { 
                    border: none; padding: 10px 24px; border-radius: 8px; 
                    cursor: pointer; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;
                    transition: all 0.2s; display: flex; align-items: center; gap: 8px;
                }
                .btn-primary { background: #8b5cf6; color: white; }
                .btn-primary:hover { background: #7c3aed; transform: translateY(-1px); }
                .btn-primary:active { transform: translateY(0); }
                
                .btn-outline { background: transparent; color: #8b5cf6; border: 1px solid #8b5cf6; }
                .btn-outline:hover { background: rgba(139, 92, 246, 0.1); }
                .btn-outline:disabled { color: #444; border-color: #333; cursor: wait; }

                .status { font-family: ui-monospace, monospace; font-size: 12px; color: #666; }
                .status b { color: #8b5cf6; font-weight: normal; }

                h1 { font-size: 18px; margin: 0 0 20px 0; letter-spacing: 2px; color: #8b5cf6; font-weight: 900; }
            </style>
        </head>
        <body>
            <h1>UBEVID</h1>

            <div class="stage-container">
                <canvas id="stage" width="${config.width}" height="${config.height}"></canvas>
            </div>
            
            <div class="controls">
                <input type="range" id="seeker" class="seeker" min="0" max="${totalFrames - 1}" value="0">
                
                <div class="actions">
                    <div class="btn-group">
                        <button id="playBtn" class="btn btn-primary">PLAY</button>
                        <button id="dlBtn" class="btn btn-outline">DOWNLOAD MP4</button>
                    </div>
                    <div class="status">
                        FRAME: <b id="fnum">0</b> / ${totalFrames - 1}
                    </div>
                </div>
            </div>

            <script>
                const canvas = document.getElementById('stage');
                const ctx = canvas.getContext('2d');
                const seeker = document.getElementById('seeker');
                const fnum = document.getElementById('fnum');
                const playBtn = document.getElementById('playBtn');
                const dlBtn = document.getElementById('dlBtn');

                let isPlaying = false;
                let lastFrameTime = 0;
                const frameDelay = 1000 / ${config.fps};
                const totalFrames = ${totalFrames};

                async function update(f) {
                    f = Math.max(0, Math.min(parseInt(f), totalFrames - 1));
                    fnum.innerText = f;
                    seeker.value = f;
                    
                    try {
                        const res = await fetch(window.location.pathname + '?f=' + f);
                        if (!res.ok) return;

                        const buf = await res.arrayBuffer();
                        const pix = new Uint8ClampedArray(buf);
                        const dat = new ImageData(pix, ${config.width}, ${config.height});
                        ctx.putImageData(dat, 0, 0);
                    } catch (e) {}
                }

                function loop(time) {
                    if (!isPlaying) return;
                    if (time - lastFrameTime >= frameDelay) {
                        let next = (parseInt(seeker.value) + 1) % totalFrames;
                        update(next);
                        lastFrameTime = time;
                    }
                    requestAnimationFrame(loop);
                }

                playBtn.onclick = () => {
                    isPlaying = !isPlaying;
                    playBtn.innerText = isPlaying ? 'PAUSE' : 'PLAY';
                    if (isPlaying) {
                        lastFrameTime = performance.now();
                        requestAnimationFrame(loop);
                    }
                };

                seeker.oninput = (e) => {
                    isPlaying = false;
                    playBtn.innerText = 'PLAY';
                    update(e.target.value);
                };

                dlBtn.onclick = async () => {
                    const originalText = dlBtn.innerText;
                    dlBtn.disabled = true;
                    dlBtn.innerText = "RENDERING...";
                    
                    // Direct browser download by navigating to the export URL
                    window.location.href = window.location.pathname + "?export=1";
                    
                    // Re-enable after a delay (since we can't easily detect download finish)
                    setTimeout(() => {
                        dlBtn.disabled = false;
                        dlBtn.innerText = originalText;
                    }, 5000);
                };

                // Load initial frame
                update(0);
            </script>
        </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    },
  });
}