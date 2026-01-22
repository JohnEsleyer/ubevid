import { renderSingleFrame } from "./engine";
import type { RenderConfig, SceneNode } from "./types";

export function startPreview(
  sceneComponent: () => SceneNode, 
  config: RenderConfig
) {
  const port = 3000;
  const serverId = Math.floor(Math.random() * 100);
  
  console.log(`\n🚀 Ubevid Proxy-Safe Server [ID: ${serverId}]`);
  console.log(`📡 Access via: http://0.0.0.0:${port}\n`);

  Bun.serve({
    port,
    hostname: "0.0.0.0",
    async fetch(req) {
      const url = new URL(req.url);
      
      // 1. ACTION: Export/Download (Triggered by ?export=1)
      if (url.searchParams.has("export")) {
        console.log(`🎬 [Server ${serverId}] Starting full render for download...`);
        const tempFile = `export-${Date.now()}.mp4`;
        try {
          const { render } = await import("./engine");
          await render(sceneComponent, config, tempFile);
          
          const file = Bun.file(tempFile);
          return new Response(file, {
            headers: {
              "Content-Type": "video/mp4",
              "Content-Disposition": 'attachment; filename="ubevid-export.mp4"',
            },
          });
        } catch (e: any) {
          console.error("Render Failed:", e);
          return new Response("Render Failed: " + e.message, { status: 500 });
        }
      }

      // 2. ACTION: Single Frame (Triggered by ?f=N)
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
          return new Response("Render Error: " + e.message, { status: 500 });
        }
      }

      // 3. UI: Root Page
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
              <title>Ubevid Preview</title>
              <style>
                  body { background: #000; color: #fff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px; margin: 0; }
                  canvas { border: 2px solid #333; background: #000; max-width: 90vw; height: auto; border-radius: 4px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                  .controls { margin-top: 30px; background: #111; padding: 25px; border-radius: 12px; width: 800px; max-width: 90vw; border: 1px solid #222; }
                  .toolbar { display: flex; align-items: center; justify-content: space-between; margin-top: 20px; }
                  button { border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.2s; }
                  .btn-play { background: #8b5cf6; color: white; min-width: 100px; }
                  .btn-play.playing { background: #ef4444; }
                  .btn-download { background: transparent; color: #8b5cf6; border: 1px solid #8b5cf6; }
                  .btn-download:hover { background: #8b5cf6; color: white; }
                  .btn-download:disabled { border-color: #333; color: #333; cursor: not-allowed; }
                  .stats { font-family: monospace; color: #666; font-size: 12px; }
                  input[type=range] { width: 100%; cursor: pointer; accent-color: #8b5cf6; }
              </style>
          </head>
          <body>
            <div style="margin-bottom: 20px; text-align: center;">
              <h2 style="margin:0; color: #8b5cf6; letter-spacing: 2px;">UBEVID PREVIEW</h2>
              <p style="color: #444; font-size: 11px;">SERVER ID: ${serverId} | RESOLUTION: ${config.width}x${config.height}</p>
            </div>
            <canvas id="stage" width="${config.width}" height="${config.height}"></canvas>
            <div class="controls">
              <input type="range" id="seeker" min="0" max="${config.fps * config.duration - 1}" value="0">
              <div class="toolbar">
                  <div style="display:flex; gap: 10px;">
                      <button id="playBtn" class="btn-play">PLAY</button>
                      <button id="dlBtn" class="btn-download">DOWNLOAD MP4</button>
                  </div>
                  <div class="stats">FRAME: <span id="fnum" style="color:#8b5cf6">0</span></div>
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

              async function update(f) {
                  fnum.innerText = f;
                  seeker.value = f;
                  const res = await fetch('?f=' + f);
                  if (!res.ok) return;
                  const buf = await res.arrayBuffer();
                  const pix = new Uint8ClampedArray(buf);
                  const dat = new ImageData(pix, ${config.width}, ${config.height});
                  ctx.putImageData(dat, 0, 0);
              }

              function playLoop(timestamp) {
                  if (!isPlaying) return;
                  if (timestamp - lastFrameTime >= frameDelay) {
                      update((parseInt(seeker.value) + 1) % ${config.fps * config.duration});
                      lastFrameTime = timestamp;
                  }
                  requestAnimationFrame(playLoop);
              }

              playBtn.onclick = () => {
                  isPlaying = !isPlaying;
                  playBtn.innerText = isPlaying ? 'PAUSE' : 'PLAY';
                  playBtn.classList.toggle('playing', isPlaying);
                  if (isPlaying) requestAnimationFrame(playLoop);
              };

              dlBtn.onclick = async () => {
                  dlBtn.disabled = true;
                  dlBtn.innerText = "RENDERING...";
                  try {
                      // FETCHING VIA QUERY PARAMETER TO AVOID PROXY 404
                      const response = await fetch('?export=1');
                      if (!response.ok) throw new Error("Render failed");
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = "ubevid-export.mp4";
                      a.click();
                  } catch (e) { alert("Export failed. Check server logs."); }
                  finally { dlBtn.disabled = false; dlBtn.innerText = "DOWNLOAD MP4"; }
              };

              seeker.oninput = () => { if (isPlaying) playBtn.click(); update(seeker.value); };
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