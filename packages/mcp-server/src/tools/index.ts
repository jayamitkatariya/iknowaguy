import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerHumanTools } from "./humans.js";
import { registerBountyTools } from "./bounties.js";
import { registerMessageTools } from "./messages.js";
import { registerDisputeTools } from "./disputes.js";
import { registerPaymentTools } from "./payments.js";
import { registerCategoryTools } from "./categories.js";

export {
  registerHumanTools,
  registerBountyTools,
  registerMessageTools,
  registerDisputeTools,
  registerPaymentTools,
  registerCategoryTools,
};

export function registerAllTools(server: McpServer) {
  registerHumanTools(server);
  registerBountyTools(server);
  registerMessageTools(server);
  registerDisputeTools(server);
  registerPaymentTools(server);
  registerCategoryTools(server);
}