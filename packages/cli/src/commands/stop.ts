import * as chalkNS from "chalk"; const chalk = chalkNS.default;
import { readPid, removePid } from "../lib/config.js";

const C = chalk.green;
const W = chalk.white.bold;

export class Stop {
  name = "stop";
  description = "Stop the MCP proxy";

  async run(_args: string[]): Promise<void> {
    console.log(W("\n🛑 Stopping iknowaguy\n"));

    const mcpPid = readPid("mcp");
    if (mcpPid) {
      try {
        process.kill(mcpPid, "SIGTERM");
        console.log(C(`   MCP proxy (PID: ${mcpPid}) stopped`));
        removePid("mcp");
        console.log(C("\n✅ iknowaguy stopped\n"));
      } catch {
        removePid("mcp");
        console.log(C("\n✅ Stale process cleaned up\n"));
      }
    } else {
      console.log(W("No running MCP proxy found.\n"));
    }
  }
}
