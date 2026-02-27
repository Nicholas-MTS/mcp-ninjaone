import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NinjaOneClient } from "../ninjaone-client.js";

function toolResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

export function registerJobTools(
  server: McpServer,
  client: NinjaOneClient,
) {
  // ── List Running Jobs ────────────────────────────────────────────────
  server.tool(
    "list_running_jobs",
    "List currently running jobs across all devices. Jobs include scripting tasks, patch installations, and other automated operations.",
    {
      device_filter: z
        .string()
        .optional()
        .describe(
          "Filter expression to limit results to specific devices (e.g., 'org = 123')",
        ),
      job_type: z
        .string()
        .optional()
        .describe(
          "Filter by job type (e.g., SCRIPT, PATCH_INSTALL, CONDITION_ACTION)",
        ),
      page_size: z
        .number()
        .optional()
        .default(100)
        .describe("Number of jobs to return"),
    },
    async ({ device_filter, job_type, page_size }) => {
      const params: Record<string, string> = {
        pageSize: String(page_size),
      };
      if (device_filter) params.df = device_filter;
      if (job_type) params.jobType = job_type;

      try {
        const results = await client.get("/jobs", params);
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error listing running jobs: ${error}`,
          true,
        );
      }
    },
  );

  // ── Get Device Jobs ──────────────────────────────────────────────────
  server.tool(
    "get_device_jobs",
    "Get all jobs (running, completed, and failed) for a specific device.",
    {
      device_id: z.number().describe("NinjaOne device ID"),
      job_type: z
        .string()
        .optional()
        .describe(
          "Filter by job type (e.g., SCRIPT, PATCH_INSTALL, CONDITION_ACTION)",
        ),
    },
    async ({ device_id, job_type }) => {
      const params: Record<string, string> = {};
      if (job_type) params.jobType = job_type;

      try {
        const results = await client.get(
          `/device/${device_id}/jobs`,
          params,
        );
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error fetching device jobs: ${error}`,
          true,
        );
      }
    },
  );

  // ── Run Script on Device ─────────────────────────────────────────────
  server.tool(
    "run_script_on_device",
    "Execute a saved script on a specific device. The script must already exist in NinjaOne's script library.",
    {
      device_id: z
        .number()
        .describe("NinjaOne device ID to run the script on"),
      script_id: z
        .number()
        .describe("ID of the saved script to execute"),
      run_as: z
        .enum(["SYSTEM", "LOGGED_ON_USER"])
        .optional()
        .default("SYSTEM")
        .describe("Security context to run the script under"),
      parameters: z
        .string()
        .optional()
        .describe("Optional parameters to pass to the script"),
    },
    async ({ device_id, script_id, run_as, parameters }) => {
      const data: Record<string, unknown> = {
        id: script_id,
        runAs: run_as,
      };
      if (parameters) data.parameters = parameters;

      try {
        const result = await client.post(
          `/device/${device_id}/script/run`,
          data,
        );
        return toolResult(
          `Script ${script_id} queued for execution on device ${device_id}.\n${JSON.stringify(result, null, 2)}`,
        );
      } catch (error) {
        return toolResult(
          `Error running script on device: ${error}`,
          true,
        );
      }
    },
  );
}
