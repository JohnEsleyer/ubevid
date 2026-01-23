import type { RenderConfig } from "./types.js";

export function getPreviewHTML(config: RenderConfig, totalFrames: number): string {
  return `<!DOCTYPE html>
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
              margin-bottom: 20px; line-height: 0; position: relative;
          }
          .hud {
              position: absolute; top: 10px; right: 10px; 
              background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
              padding: 8px 12px; border-radius: 6px; font-family: ui-monospace, monospace; font-size: 10px;
              color: #4ade80; border: 1px solid #222; pointer-events: none;
          }
          .connection-status {
              position: fixed; bottom: 20px; right: 20px;
              padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold;
              background: #ef4444; color: white; opacity: 0; transition: opacity 0.3s;
              pointer-events: none;
          }
          .connection-status.show { opacity: 1; }
          
          canvas { max-width: 90vw; max-height: 60vh; object-fit: contain; }
          
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
      <h1>UBEVID <span style="font-weight:400; opacity:0.5; font-size: 12px;">PREVIEW</span></h1>

      <div class="stage-container">
          <canvas id="stage" width="${config.width}" height="${config.height}"></canvas>
          <div class="hud" id="hud">MEM: 0MB | LAT: 0ms</div>
      </div>
      
      <div class="controls">
          <input type="range" id="seeker" class="seeker" min="0" max="${totalFrames - 1}" value="0">
          
          <div class="actions">
              <div class="btn-group">
                  <button id="playBtn" class="btn btn-primary">PLAY</button>
                  <button id="dlBtn" class="btn btn-outline">DOWNLOAD MP4</button>
              </div>
              <div class="status">
                  FRAME: <b id="fnum">0</b> / ${totalFrames - 1} <span style="margin-left:10px; opacity:0.5">${config.width}x${config.height} @ ${config.fps}fps</span>
              </div>
          </div>
      </div>

      <div id="connectionStatus" class="connection-status">🔌 DISCONNECTED</div>

      <script>
          const canvas = document.getElementById('stage');
          const ctx = canvas.getContext('2d');
          const seeker = document.getElementById('seeker');
          const fnum = document.getElementById('fnum');
          const hud = document.getElementById('hud');
          const playBtn = document.getElementById('playBtn');
          const dlBtn = document.getElementById('dlBtn');
          const connStatus = document.getElementById('connectionStatus');

          let isPlaying = false;
          let lastFrameTime = 0;
          const frameDelay = 1000 / ${config.fps};
          const totalFrames = ${totalFrames};
          let isConnected = true;

          async function update(f) {
              f = Math.max(0, Math.min(parseInt(f), totalFrames - 1));
              fnum.innerText = f;
              seeker.value = f;
              
              const start = performance.now();
              try {
                  const res = await fetch(window.location.pathname + '?f=' + f);
                  
                  if (!res.ok) throw new Error("Server error");
                  
                  if (!isConnected) {
                      isConnected = true;
                      connStatus.classList.remove('show');
                  }

                  const buf = await res.arrayBuffer();
                  const pix = new Uint8ClampedArray(buf);
                  const dat = new ImageData(pix, ${config.width}, ${config.height});
                  ctx.putImageData(dat, 0, 0);
                  
                  const dur = (performance.now() - start).toFixed(1);
                  const mem = window.performance.memory ? Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) : '-';
                  hud.innerText = 'RNDR: ' + dur + 'ms';
              } catch (e) {
                  // Connection lost logic
                  if (isConnected) {
                      isConnected = false;
                      connStatus.classList.add('show');
                      connStatus.innerText = "🔌 RECONNECTING...";
                  }
              }
          }

          // Live Reload Polling
          // If the server restarts (via bun --watch), fetch will fail then succeed.
          // We check /?f=X every second if not playing to ensure we display latest code changes.
          setInterval(() => {
              if (!isPlaying) {
                  update(seeker.value);
              }
          }, 1000);

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
              window.location.href = window.location.pathname + "?export=1";
              setTimeout(() => {
                  dlBtn.disabled = false;
                  dlBtn.innerText = originalText;
              }, 5000);
          };

          update(0);
      </script>
  </body>
  </html>`;
}