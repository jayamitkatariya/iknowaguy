import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerHumanTools } from "./tools/humans.js";
import { registerBountyTools } from "./tools/bounties.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerDisputeTools } from "./tools/disputes.js";
import { registerPaymentTools } from "./tools/payments.js";
import { registerCategoryTools } from "./tools/categories.js";

const server = new McpServer({
  name: "hireahuman",
  version: "0.1.0",
});

registerHumanTools(server);
registerBountyTools(server);
registerMessageTools(server);
registerDisputeTools(server);
registerPaymentTools(server);
registerCategoryTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("HireAHuman MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { server };
