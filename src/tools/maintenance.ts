import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NinjaOneClient } from "../ninjaone-client.js";

function toolResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

export function registerMaintenanceTools(
  server: McpServer,
  client: NinjaOneClient,
) {
  // ── List Maintenance Windows ─────────────────────────────────────────
  server.tool(
    "list_maintenance_windows",
    "List all scheduled maintenance windows across organizations and devices. Maintenance windows suppress alerts during planned work.",
    {
      page_size: z
        .number()
        .optional()
        .default(100)
        .describe("Number of maintenance windows to return"),
    },
    async ({ page_size }) => {
      const params: Record<string, string> = {
        pageSize: String(page_size),
      };

      try {
        const results = await client.get("/maintenance", params);
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error listing maintenance windows: ${error}`,
          true,
        );
      }
    },
  );

  // ── Create Device Maintenance Window ────────────────────────────────
  server.tool(
    "create_maintenance_window",
    "Create a maintenance window for a device to suppress alerts during planned maintenance. The window disables alerting for the specified duration.",
    {
      device_id: z.number().describe("NinjaOne device ID to put into maintenance"),
      start: z
        .number()
        .describe(
          "Maintenance window start time as a Unix timestamp (seconds). Use current time for immediate start.",
        ),
      end: z
        .number()
        .describe(
          "Maintenance window end time as a Unix timestamp (seconds).",
        ),
      disable_alerts: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to disable alerts during the maintenance window"),
    },
    async ({ device_id, start, end, disable_alerts }) => {
      const data: Record<string, unknown> = {
        start,
        end,
        disabledFeatures: disable_alerts ? ["ALERTS"] : [],
      };

      try {
        await client.put(`/device/${device_id}/maintenance`, data);
        return toolResult(
          `Maintenance window created for device ${device_id}.\nStart: ${new Date(start * 1000).toISOString()}\nEnd: ${new Date(end * 1000).toISOString()}`,
        );
      } catch (error) {
        return toolResult(
          `Error creating maintenance window: ${error}`,
          true,
        );
      }
    },
  );

  // ── Cancel Device Maintenance ────────────────────────────────────────
  server.tool(
    "cancel_device_maintenance",
    "Cancel an active maintenance window for a device, immediately re-enabling alerting.",
    {
      device_id: z
        .number()
        .describe("NinjaOne device ID to remove from maintenance"),
    },
    async ({ device_id }) => {
      try {
        await client.delete(`/device/${device_id}/maintenance`);
        return toolResult(
          `Maintenance window cancelled for device ${device_id}. Alerting is now re-enabled.`,
        );
      } catch (error) {
        return toolResult(
          `Error cancelling maintenance window: ${error}`,
          true,
        );
      }
    },
  );
}
