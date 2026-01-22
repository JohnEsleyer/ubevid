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
                  body { background: #000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; margin: 0; }
                  canvas { border: 1px solid #444; background: #111; max-width: 90vw; height: auto; }
                  .ui { margin-top: 20px; width: 500px; max-width: 90vw; }
                  input { width: 100%; height: 40px; }
              </style>
          </head>
          <body>
            <p>Ubevid Preview [Server: ${serverId}]</p>
            <canvas id="stage" width="${config.width}" height="${config.height}"></canvas>
            <div class="ui">
              <input type="range" id="seeker" min="0" max="${config.fps * config.duration - 1}" value="0">
              <div style="font-family: monospace; margin-top: 10px;">FRAME: <span id="fnum">0</span></div>
            </div>
            <script>
              const canvas = document.getElementById('stage');
              const ctx = canvas.getContext('2d');
              const seeker = document.getElementById('seeker');
              const fnum = document.getElementById('fnum');

              async function update(f) {
                  fnum.innerText = f;
                  // COMPATIBILITY FIX: We fetch from the current URL root + params
                  // This works perfectly behind Nginx/Cloud IDE proxies
                  const res = await fetch('?f=' + f);
                  
                  if (!res.ok) return;

                  const buf = await res.arrayBuffer();
                  const pix = new Uint8ClampedArray(buf);
                  
                  if (pix.length === ${config.width * config.height * 4}) {
                      const dat = new ImageData(pix, ${config.width}, ${config.height});
                      ctx.putImageData(dat, 0, 0);
                  }
              }

              seeker.oninput = (e) => update(e.target.value);
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