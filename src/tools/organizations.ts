import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NinjaOneClient } from "../ninjaone-client.js";

function toolResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

export function registerOrganizationTools(
  server: McpServer,
  client: NinjaOneClient,
) {
  // ── List Organizations ───────────────────────────────────────────────
  server.tool(
    "list_organizations",
    "List all organizations (clients/customers) in NinjaOne. Returns organization ID, name, description, and node count.",
    {
      page_size: z
        .number()
        .optional()
        .default(100)
        .describe("Number of organizations to return per page"),
      after: z
        .number()
        .optional()
        .describe("Organization ID cursor for pagination"),
    },
    async ({ page_size, after }) => {
      const params: Record<string, string> = {
        pageSize: String(page_size),
      };
      if (after !== undefined) params.after = String(after);

      try {
        const results = await client.get("/organizations", params);
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error listing organizations: ${error}`,
          true,
        );
      }
    },
  );

  // ── Get Organization ─────────────────────────────────────────────────
  server.tool(
    "get_organization",
    "Get detailed information about a specific organization by its ID, including contact info, tags, and policy assignments.",
    {
      organization_id: z.number().describe("NinjaOne organization ID"),
    },
    async ({ organization_id }) => {
      try {
        const result = await client.get(`/organization/${organization_id}`);
        return toolResult(JSON.stringify(result, null, 2));
      } catch (error) {
        return toolResult(
          `Error fetching organization: ${error}`,
          true,
        );
      }
    },
  );

  // ── List Organization Devices ────────────────────────────────────────
  server.tool(
    "list_organization_devices",
    "List all devices belonging to a specific organization.",
    {
      organization_id: z.number().describe("NinjaOne organization ID"),
    },
    async ({ organization_id }) => {
      try {
        const results = await client.get(
          `/organization/${organization_id}/devices`,
        );
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error listing organization devices: ${error}`,
          true,
        );
      }
    },
  );

  // ── Get Organization Locations ───────────────────────────────────────
  server.tool(
    "get_organization_locations",
    "Get the locations configured for a specific organization.",
    {
      organization_id: z.number().describe("NinjaOne organization ID"),
    },
    async ({ organization_id }) => {
      try {
        const results = await client.get(
          `/organization/${organization_id}/locations`,
        );
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error fetching organization locations: ${error}`,
          true,
        );
      }
    },
  );

  // ── Get Organization Policies ────────────────────────────────────────
  server.tool(
    "get_organization_policies",
    "Get the policy assignments for a specific organization.",
    {
      organization_id: z.number().describe("NinjaOne organization ID"),
    },
    async ({ organization_id }) => {
      try {
        const results = await client.get(
          `/organization/${organization_id}/policies`,
        );
        return toolResult(JSON.stringify(results, null, 2));
      } catch (error) {
        return toolResult(
          `Error fetching organization policies: ${error}`,
          true,
        );
      }
    },
  );
}
