import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./mcp-tools/index.js";
import { readConfig } from "./config.js";
import { fileURLToPath } from "url";

export async function runMcpProxy() {
  const config = readConfig();
  if (!config) {
    console.error("iknowaguy not initialized. Run 'iknowaguy init' first.");
    process.exit(1);
  }

  const server = new McpServer({
    name: "iknowaguy",
    version: config.version || "0.1.0",
  });

  registerAllTools(server, config);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`iknowaguy MCP proxy running (platform: ${config.platform_url})`);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  runMcpProxy().catch((err: any) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
