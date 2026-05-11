import * as chalkNS from "chalk"; const chalk = chalkNS.default;
import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readConfig, writePid, readPid, removePid, RUN_DIR } from "../lib/config.js";
import { mkdirSync, existsSync } from "fs";

const G = chalk.green;
const W = chalk.white.bold;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Start {
  name = "start";
  description = "Start the MCP proxy for AI agents to connect";

  async run(args: string[]): Promise<void> {
    const config = readConfig();
    if (!config) {
      console.error(chalk.red('Error: iknowaguy not initialized. Run "iknowaguy init" first.\n'));
      process.exit(1);
    }

    const mcpEntry = join(__dirname, "..", "lib", "mcp-proxy.js");
    if (!existsSync(mcpEntry)) {
      console.error(chalk.red(`Error: MCP proxy entry not found at ${mcpEntry}`));
      console.error('Please run "pnpm build" to build the CLI.\n');
      process.exit(1);
    }

    const detach = args.includes("--detach");

    if (detach) {
      const existingPid = readPid("mcp");
      if (existingPid) {
        try { process.kill(existingPid, 0); } catch {
          removePid("mcp");
        }
        if (readPid("mcp")) {
          console.error(chalk.red("MCP proxy is already running. Use 'iknowaguy stop' first."));
          process.exit(1);
        }
      }

      console.log(W("\n🚀 Starting iknowaguy MCP proxy (background)\n"));
      mkdirSync(RUN_DIR, { recursive: true });

      const proc = spawn(process.execPath, [mcpEntry], {
        detached: true,
        stdio: "ignore",
      });

      proc.on("error", (err) => {
        console.error(chalk.red(`Failed to start MCP proxy: ${err.message}`));
        process.exit(1);
      });

      proc.unref();
      writePid("mcp", proc.pid!);
      console.log(G(`   MCP proxy started (PID: ${proc.pid})`));
      console.log(W("\n✅ MCP proxy running in background\n"));
      console.log("Add this to your AI agent MCP config:\n");
      console.log(chalk.cyan(`  {"command":"iknowaguy","args":["start"]}\n`));
    } else {
      const { runMcpProxy } = await import("../lib/mcp-proxy.js");
      await runMcpProxy();
    }
  }
}
