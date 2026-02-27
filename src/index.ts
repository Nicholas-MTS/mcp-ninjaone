#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { NinjaOneClient } from "./ninjaone-client.js";
import { registerDeviceTools } from "./tools/devices.js";
import { registerOrganizationTools } from "./tools/organizations.js";
import { registerAlertTools } from "./tools/alerts.js";
import { registerMaintenanceTools } from "./tools/maintenance.js";
import { registerJobTools } from "./tools/jobs.js";

function getConfig() {
  const clientId = process.env.NINJAONE_CLIENT_ID;
  const clientSecret = process.env.NINJAONE_CLIENT_SECRET;
  const instance = process.env.NINJAONE_INSTANCE;

  if (!clientId || !clientSecret || !instance) {
    console.error(
      "Missing required environment variables: NINJAONE_CLIENT_ID, NINJAONE_CLIENT_SECRET, NINJAONE_INSTANCE",
    );
    process.exit(1);
  }

  return { clientId, clientSecret, instance };
}

async function main() {
  const config = getConfig();
  const client = new NinjaOneClient(config);

  const server = new McpServer({
    name: "ninjaone",
    version: "1.0.0",
  });

  registerDeviceTools(server, client);
  registerOrganizationTools(server, client);
  registerAlertTools(server, client);
  registerMaintenanceTools(server, client);
  registerJobTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("NinjaOne MCP server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
