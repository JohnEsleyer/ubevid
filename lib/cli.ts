import pc from "picocolors";
import os from "node:os";
import cliProgress from "cli-progress";

export interface HardwareReport {
  mode: "gpu" | "cpu";
  device: string;
}

export function printAmethystHeader(report: HardwareReport, sketchName: string, config: any) {
  const isGpu = report.mode === "gpu";
  const modeBadge = isGpu 
    ? pc.bgCyan(pc.black(" ⚡ GPU ACCELERATED ")) 
    : pc.bgYellow(pc.black(" 🐌 CPU RECOVERY MODE "));

  console.log(`\n${pc.magenta("💎 AMETHYST")} ${pc.dim("v0.2.0")}`);
  console.log(pc.dim("──────────────────────────────────────────────────────────"));
  console.log(`${pc.white("🎬 PROJECT: ")} ${pc.cyan(sketchName)}`);
  console.log(`${pc.white("📦 OUTPUT:  ")} ${pc.white(config.width + "x" + config.height + " @ " + config.fps + "fps")}`);
  
  console.log(`\n${pc.white("🖥️  ENVIRONMENT")}`);
  console.log(`   ├─ ${pc.white("OS:")}      ${os.type()} (${os.arch()})`);
  console.log(`   ├─ ${pc.white("CORES:")}   ${os.cpus().length} Threads (Bun Workers)`);
  console.log(`   └─ ${pc.white("ENGINE:")}  ${modeBadge}`);
  console.log(`               ${pc.dim(`Device: ${report.device}`)}`);
  console.log(pc.dim("──────────────────────────────────────────────────────────\n"));
}

export function createProgressBar() {
  return new cliProgress.SingleBar({
    format: `${pc.magenta("{bar}")} ${pc.bold("{percentage}%")} | ${pc.dim("{value}/{total} frames")} | ETA: ${pc.cyan("{eta}s")}`,
    barCompleteChar: "█",
    barIncompleteChar: "░",
    hideCursor: true,
  });
}