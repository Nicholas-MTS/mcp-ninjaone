import http from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { NinjaOneClient } from "./ninjaone-client.js";
import { registerDeviceTools } from "./tools/devices.js";
import { registerOrganizationTools } from "./tools/organizations.js";
import { registerAlertTools } from "./tools/alerts.js";
import { registerMaintenanceTools } from "./tools/maintenance.js";
import { registerJobTools } from "./tools/jobs.js";

const PORT = parseInt(process.env.PORT ?? "8080", 10);

// Validate required env vars at startup — NinjaOneClient reads these itself
if (!process.env.NINJAONE_CLIENT_ID || !process.env.NINJAONE_CLIENT_SECRET || !process.env.NINJAONE_INSTANCE) {
  console.error("ERROR: NINJAONE_CLIENT_ID, NINJAONE_CLIENT_SECRET, and NINJAONE_INSTANCE are required");
  process.exit(1);
}

function buildServer(): McpServer {
  // NinjaOneClient reads credentials from env vars internally
  const client = new NinjaOneClient();

  const server = new McpServer({
    name: "ninjaone-mcp",
    version: "1.0.0",
  });

  registerDeviceTools(server, client);
  registerOrganizationTools(server, client);
  registerAlertTools(server, client);
  registerMaintenanceTools(server, client);
  registerJobTools(server, client);

  return server;
}

const httpServer = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", transport: "streamable-http" }));
    return;
  }

  if (req.url === "/mcp") {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close().catch(() => {});
    });

    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.error(`NinjaOne MCP server listening on port ${PORT}`);
  console.error(`MCP endpoint:   http://0.0.0.0:${PORT}/mcp`);
  console.error(`Health check:   http://0.0.0.0:${PORT}/health`);
});

httpServer.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
