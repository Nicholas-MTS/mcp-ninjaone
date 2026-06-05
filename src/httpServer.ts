import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { NinjaOneClient } from "./ninjaone-client.js";
import { registerDeviceTools } from "./tools/devices.js";
import { registerOrganizationTools } from "./tools/organizations.js";
import { registerAlertTools } from "./tools/alerts.js";
import { registerMaintenanceTools } from "./tools/maintenance.js";
import { registerJobTools } from "./tools/jobs.js";

const PORT = parseInt(process.env.PORT ?? "8080", 10);

// Validate required env vars at startup
const NINJAONE_CLIENT_ID = process.env.NINJAONE_CLIENT_ID;
const NINJAONE_CLIENT_SECRET = process.env.NINJAONE_CLIENT_SECRET;
const NINJAONE_INSTANCE = process.env.NINJAONE_INSTANCE ?? "app.ninjarmm.com";

if (!NINJAONE_CLIENT_ID || !NINJAONE_CLIENT_SECRET) {
  console.error(
    "ERROR: NINJAONE_CLIENT_ID and NINJAONE_CLIENT_SECRET environment variables are required"
  );
  process.exit(1);
}

// Factory — creates a fresh Server + registered tools per request.
// Required for stateless StreamableHTTPServerTransport.
function buildServer(): Server {
  const client = new NinjaOneClient(
    NINJAONE_CLIENT_ID!,
    NINJAONE_CLIENT_SECRET!,
    NINJAONE_INSTANCE
  );

  const server = new Server(
    { name: "ninjaone-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  registerDeviceTools(server, client);
  registerOrganizationTools(server, client);
  registerAlertTools(server, client);
  registerMaintenanceTools(server, client);
  registerJobTools(server, client);

  return server;
}

const httpServer = http.createServer(async (req, res) => {
  // Health check — used by Azure Container Apps
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", transport: "streamable-http" }));
    return;
  }

  // MCP endpoint — Claude.ai connectors page connects here
  if (req.url === "/mcp") {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
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
  console.error(`Instance:       ${NINJAONE_INSTANCE}`);
});

httpServer.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
