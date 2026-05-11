import * as chalkNS from "chalk"; const chalk = chalkNS.default;
import { readPid, readConfig, removePid, CONFIG_FILE } from "../lib/config.js";

const C = chalk.green;
const W = chalk.white.bold;
const G = chalk.gray;

export class Status {
  name = "status";
  description = "Check if MCP proxy is running";

  async run(_args: string[]): Promise<void> {
    console.log(W("\n📊 iknowaguy Status\n"));

    const config = readConfig();
    if (!config) {
      console.log(G("Not initialized. Run \"iknowaguy init\" first.\n"));
      return;
    }

    console.log(W("Config: ") + G(CONFIG_FILE));
    console.log(W("Tenant: ") + G(config.tenant_id));
    console.log(W("Platform: ") + G(config.platform_url));
    console.log("");

    const mcpPid = readPid("mcp");
    if (mcpPid) {
      try {
        process.kill(mcpPid, 0);
        console.log(C("✓ MCP proxy running") + " (PID: " + mcpPid + ")");
      } catch {
        console.log(chalk.red("✗ MCP proxy not responding") + " (stale PID: " + mcpPid + ")");
        removePid("mcp");
      }
    } else {
      console.log(chalk.gray("○ MCP proxy not running"));
    }
    console.log("");
  }
}
