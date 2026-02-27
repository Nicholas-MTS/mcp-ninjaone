import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NinjaOneClient } from "../ninjaone-client.js";

function toolResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

export function registerDeviceTools(
  server: McpServer,
  client: NinjaOneClient,
) {
  // ── List Devices ─────────────────────────────────────────────────────
  server.tool(
    "list_devices",
    "List all devices managed by NinjaOne. Returns device name, OS, online status, organization, and last contact time.",
    {
      page_size: z
        .number()
        .optional()
        .default(100)
        .describe("Number of devices to return per page (max 1000)"),
      after: z
        .number()
        .optional()
        .describe("Device ID cursor for pagination — returns devices after this ID"),
      organization_id: z
        .number()
        .optional()
        .describe("Filter devices by organization ID"),
    },
    async ({ page_size, after, organization_id }) => {
      const params: Record<string, string> = {
        pageSize: String(page_size),
      };
      if (after !== undefined) params.after = String(after);
      if (organization_id !== undefined)
        params.organizationId = String(organization_id);

      try {
        const results = await client.get("/devices", params);
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(`Error listing devices: ${error}`, true);
      }
    },
  );

  // ── Get Device ───────────────────────────────────────────────────────
  server.tool(
    "get_device",
    "Get detailed information about a specific device by its ID, including hardware, OS, agent version, and network details.",
    {
      device_id: z.number().describe("NinjaOne device ID"),
    },
    async ({ device_id }) => {
      try {
        const result = await client.get(`/device/${device_id}`);
        return toolResult(JSON.stringify(result, null, 2));
      } catch (error) {
        return toolResult(`Error fetching device: ${error}`, true);
      }
    },
  );

  // ── Get Device Activities ────────────────────────────────────────────
  server.tool(
    "get_device_activities",
    "Get recent activity log for a specific device. Shows events such as alerts triggered, scripts run, and status changes.",
    {
      device_id: z.number().describe("NinjaOne device ID"),
      page_size: z
        .number()
        .optional()
        .default(50)
        .describe("Number of activity entries to return"),
      after: z
        .number()
        .optional()
        .describe("Activity ID cursor for pagination"),
      activity_type: z
        .string()
        .optional()
        .describe("Filter by activity type (e.g., CONDITION, PATCH, SCRIPT)"),
    },
    async ({ device_id, page_size, after, activity_type }) => {
      const params: Record<string, string> = {
        pageSize: String(page_size),
      };
      if (after !== undefined) params.after = String(after);
      if (activity_type) params.activityType = activity_type;

      try {
        const results = await client.get(
          `/device/${device_id}/activities`,
          params,
        );
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error fetching device activities: ${error}`,
          true,
        );
      }
    },
  );

  // ── Get Device OS Patch Status ───────────────────────────────────────
  server.tool(
    "get_device_os_patch_status",
    "Get the OS patch status for a specific device, showing pending, installed, and failed patches.",
    {
      device_id: z.number().describe("NinjaOne device ID"),
    },
    async ({ device_id }) => {
      try {
        const result = await client.get(`/device/${device_id}/os-patch-installs`);
        return toolResult(JSON.stringify(result, null, 2));
      } catch (error) {
        return toolResult(
          `Error fetching OS patch status: ${error}`,
          true,
        );
      }
    },
  );

  // ── Get Device Software ──────────────────────────────────────────────
  server.tool(
    "get_device_software",
    "Get the list of installed software on a specific device.",
    {
      device_id: z.number().describe("NinjaOne device ID"),
    },
    async ({ device_id }) => {
      try {
        const result = await client.get(`/device/${device_id}/software`);
        return toolResult(JSON.stringify(result, null, 2));
      } catch (error) {
        return toolResult(
          `Error fetching device software: ${error}`,
          true,
        );
      }
    },
  );

  // ── Get Device Processor Info ────────────────────────────────────────
  server.tool(
    "get_device_processor_info",
    "Get CPU/processor information for a specific device.",
    {
      device_id: z.number().describe("NinjaOne device ID"),
    },
    async ({ device_id }) => {
      try {
        const result = await client.get(`/device/${device_id}/processors`);
        return toolResult(JSON.stringify(result, null, 2));
      } catch (error) {
        return toolResult(
          `Error fetching processor info: ${error}`,
          true,
        );
      }
    },
  );

  // ── Get Device Disks ─────────────────────────────────────────────────
  server.tool(
    "get_device_disks",
    "Get disk/storage information for a specific device, including capacity and free space.",
    {
      device_id: z.number().describe("NinjaOne device ID"),
    },
    async ({ device_id }) => {
      try {
        const result = await client.get(`/device/${device_id}/disks`);
        return toolResult(JSON.stringify(result, null, 2));
      } catch (error) {
        return toolResult(
          `Error fetching disk info: ${error}`,
          true,
        );
      }
    },
  );
}
