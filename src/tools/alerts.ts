import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NinjaOneClient } from "../ninjaone-client.js";

function toolResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

export function registerAlertTools(
  server: McpServer,
  client: NinjaOneClient,
) {
  // ── List Alerts ──────────────────────────────────────────────────────
  server.tool(
    "list_alerts",
    "List active alerts and conditions across all devices in NinjaOne. Returns alert UID, severity, message, device, and trigger time.",
    {
      severity: z
        .enum(["NONE", "MINOR", "MODERATE", "MAJOR", "CRITICAL"])
        .optional()
        .describe("Filter alerts by severity level"),
      device_filter: z
        .string()
        .optional()
        .describe("Filter expression to limit devices (e.g., 'org = 123')"),
      page_size: z
        .number()
        .optional()
        .default(100)
        .describe("Number of alerts to return"),
      after: z
        .number()
        .optional()
        .describe("Alert ID cursor for pagination"),
    },
    async ({ severity, device_filter, page_size, after }) => {
      const params: Record<string, string> = {
        pageSize: String(page_size),
      };
      if (severity) params.severity = severity;
      if (device_filter) params.df = device_filter;
      if (after !== undefined) params.after = String(after);

      try {
        const results = await client.get("/alerts", params);
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(`Error listing alerts: ${error}`, true);
      }
    },
  );

  // ── List Device Alerts ───────────────────────────────────────────────
  server.tool(
    "list_device_alerts",
    "List all active alerts for a specific device.",
    {
      device_id: z.number().describe("NinjaOne device ID"),
    },
    async ({ device_id }) => {
      try {
        const results = await client.get(`/device/${device_id}/alerts`);
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error listing device alerts: ${error}`,
          true,
        );
      }
    },
  );

  // ── Reset Alert ──────────────────────────────────────────────────────
  server.tool(
    "reset_alert",
    "Reset (acknowledge and clear) an active alert by its UID. Use list_alerts or list_device_alerts to find the alert UID.",
    {
      alert_uid: z
        .string()
        .describe("The unique identifier (UID) of the alert to reset"),
    },
    async ({ alert_uid }) => {
      try {
        await client.delete(`/alert/${alert_uid}`);
        return toolResult(
          `Alert ${alert_uid} has been reset successfully.`,
        );
      } catch (error) {
        return toolResult(`Error resetting alert: ${error}`, true);
      }
    },
  );

  // ── List Alert Conditions ────────────────────────────────────────────
  server.tool(
    "list_alert_conditions",
    "List all configured alert conditions (triggers) in NinjaOne.",
    {
      page_size: z
        .number()
        .optional()
        .default(100)
        .describe("Number of conditions to return"),
    },
    async ({ page_size }) => {
      const params: Record<string, string> = {
        pageSize: String(page_size),
      };

      try {
        const results = await client.get("/conditions", params);
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error listing alert conditions: ${error}`,
          true,
        );
      }
    },
  );
}
