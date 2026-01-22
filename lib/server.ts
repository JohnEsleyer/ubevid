import { renderSingleFrame } from "./engine";
import type { RenderConfig, SceneNode } from "./types";

export function startPreview(
  sceneComponent: () => SceneNode, 
  config: RenderConfig
) {
  const port = 3000;
  const serverId = Math.floor(Math.random() * 100);
  
  console.log(`\n🚀 Ubevid Proxy-Safe Server [ID: ${serverId}]`);
  console.log(`Binds to: http://0.0.0.0:${port}\n`);

  Bun.serve({
    port,
    hostname: "0.0.0.0",
    async fetch(req) {
      const url = new URL(req.url);
      
      // LOGGING
      console.log(`[REQ] ${url.search || "UI"}`);

      // 1. If there is a ?f= query, return the FRAME
      if (url.searchParams.has("f")) {
        const frame = parseInt(url.searchParams.get("f") || "0", 10);
        try {
          const rgbaBuffer = await renderSingleFrame(sceneComponent, config, frame);
          return new Response(rgbaBuffer, { 
            headers: { 
                "Content-Type": "application/octet-stream",
                "Access-Control-Allow-Origin": "*" 
            } 
          });
        } catch (e: any) {
          return new Response("Error: " + e.message, { status: 500 });
        }
      }

      // 2. Otherwise, serve the UI on the root
      return new Response(
        `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Ubevid Preview</title>
                <style>
                    body { background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px; margin: 0; }
                    canvas { border: 2px solid #333; background: #000; max-width: 90vw; height: auto; border-radius: 4px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                    
                    .controls { margin-top: 30px; background: #111; padding: 20px; border-radius: 12px; width: 800px; max-width: 90vw; border: 1px solid #222; }
                    .seeker-container { width: 100%; display: flex; align-items: center; gap: 15px; }
                    input[type=range] { flex: 1; cursor: pointer; accent-color: #8b5cf6; }
                    
                    .toolbar { display: flex; align-items: center; justify-content: space-between; margin-top: 15px; }
                    .btn-play { 
                        background: #8b5cf6; color: white; border: none; padding: 8px 24px; 
                        border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;
                        transition: background 0.2s; min-width: 100px;
                    }
                    .btn-play:hover { background: #7c3aed; }
                    .btn-play.playing { background: #ef4444; }
                    
                    .stats { font-family: monospace; color: #666; font-size: 12px; }
                    .stats span { color: #8b5cf6; }
                </style>
            </head>
            <body>
            <div style="margin-bottom: 20px; text-align: center;">
                <h2 style="margin:0; color: #8b5cf6;">UBEVID PREVIEW</h2>
                <p style="color: #444; font-size: 12px;">Server ID: ${serverId}</p>
            </div>

            <canvas id="stage" width="${config.width}" height="${config.height}"></canvas>
            
            <div class="controls">
                <div class="seeker-container">
                    <input type="range" id="seeker" min="0" max="${config.fps * config.duration - 1}" value="0">
                </div>
                
                <div class="toolbar">
                    <button id="playBtn" class="btn-play">PLAY</button>
                    <div class="stats">
                        FRAME: <span id="fnum">0</span> / ${config.fps * config.duration - 1} 
                        | FPS: <span>${config.fps}</span>
                    </div>
                </div>
            </div>

            <script>
                const canvas = document.getElementById('stage');
                const ctx = canvas.getContext('2d');
                const seeker = document.getElementById('seeker');
                const fnum = document.getElementById('fnum');
                const playBtn = document.getElementById('playBtn');

                let isPlaying = false;
                let lastFrameTime = 0;
                const frameDelay = 1000 / ${config.fps};

                async function update(f) {
                    f = parseInt(f);
                    fnum.innerText = f;
                    seeker.value = f;
                    
                    const res = await fetch('?f=' + f);
                    if (!res.ok) return;

                    const buf = await res.arrayBuffer();
                    const pix = new Uint8ClampedArray(buf);
                    
                    if (pix.length === ${config.width * config.height * 4}) {
                        const dat = new ImageData(pix, ${config.width}, ${config.height});
                        ctx.putImageData(dat, 0, 0);
                    }
                }

                function playLoop(timestamp) {
                    if (!isPlaying) return;

                    if (timestamp - lastFrameTime >= frameDelay) {
                        let nextFrame = (parseInt(seeker.value) + 1);
                        if (nextFrame >= ${config.fps * config.duration}) {
                            nextFrame = 0;
                        }
                        update(nextFrame);
                        lastFrameTime = timestamp;
                    }
                    requestAnimationFrame(playLoop);
                }

                playBtn.onclick = () => {
                    isPlaying = !isPlaying;
                    playBtn.innerText = isPlaying ? 'PAUSE' : 'PLAY';
                    playBtn.classList.toggle('playing', isPlaying);
                    if (isPlaying) {
                        lastFrameTime = performance.now();
                        requestAnimationFrame(playLoop);
                    }
                };

                seeker.oninput = (e) => {
                    if (isPlaying) playBtn.click(); // Pause if seeking
                    update(e.target.value);
                };

                // Initial Frame
                update(0);
            </script>
            </body>
        </html>
        `,
        { headers: { "Content-Type": "text/html" } }
        );
    },
  });
}