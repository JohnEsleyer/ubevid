import { renderSingleFrame } from "./engine";
import type { RenderConfig, SceneNode } from "./types";

export function startPreview<T>(
  sceneComponent: (props: T) => SceneNode, 
  config: RenderConfig,
  props: T = {} as T
) {
  const port = 3000;
  console.log(`\n🟣 Ubevid Preview Server: http://localhost:${port}\n`);

  Bun.serve({
    port,
    hostname: "0.0.0.0",
    async fetch(req) {
      const url = new URL(req.url);
      
      try {
        if (url.searchParams.has("export")) {
          const tempFile = `render-${Date.now()}.mp4`;
          const { render } = await import("./engine");
          await render(sceneComponent, config, tempFile, props);
          return new Response(Bun.file(tempFile), {
            headers: { "Content-Type": "video/mp4" },
          });
        }

        if (url.searchParams.has("f")) {
          const frame = parseInt(url.searchParams.get("f") || "0", 10);
          const rgbaBuffer = await renderSingleFrame(sceneComponent, config, frame, props);
          return new Response(rgbaBuffer, { headers: { "Content-Type": "application/octet-stream" } });
        }
      } catch (e: any) {
        console.error("Internal Server Error:", e);
        return new Response(e.stack || e.message, { status: 500 });
      }

      // UI Route
      const totalFrames = config.fps * config.duration;
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Ubevid</title><style>
            body { background: #000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 50px; }
            canvas { border: 1px solid #333; max-width: 80vw; }
            input { width: 600px; margin: 20px; accent-color: #8b5cf6; }
            .btn { background: #8b5cf6; color: #fff; padding: 10px 20px; border-radius: 5px; cursor: pointer; border: none; font-weight: bold; }
          </style></head>
          <body>
            <h1>Ubevid <span style="font-weight:100">Preview</span></h1>
            <canvas id="stage" width="${config.width}" height="${config.height}"></canvas>
            <input type="range" id="seeker" min="0" max="${totalFrames - 1}" value="0">
            <div>
                <button id="playBtn" class="btn">PLAY</button>
            </div>
            <p id="info">Frame: 0</p>
            <script>
              const canvas = document.getElementById('stage');
              const ctx = canvas.getContext('2d');
              const seeker = document.getElementById('seeker');
              const info = document.getElementById('info');
              const playBtn = document.getElementById('playBtn');
              
              let playing = false;

              async function loadFrame(f) {
                info.innerText = "Frame: " + f;
                const res = await fetch(window.location.pathname + '?f=' + f);
                const buf = await res.arrayBuffer();
                const pix = new Uint8ClampedArray(buf);
                const dat = new ImageData(pix, ${config.width}, ${config.height});
                ctx.putImageData(dat, 0, 0);
              }

              seeker.oninput = (e) => loadFrame(e.target.value);
              
              playBtn.onclick = () => {
                playing = !playing;
                playBtn.innerText = playing ? "PAUSE" : "PLAY";
                if(playing) tick();
              };

              async function tick() {
                if(!playing) return;
                let next = (parseInt(seeker.value) + 1) % ${totalFrames};
                seeker.value = next;
                await loadFrame(next);
                requestAnimationFrame(tick);
              }

              loadFrame(0);
            </script>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    },
  });
}