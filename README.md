# mcp-ninjaone

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for **NinjaOne** (formerly NinjaRMM), providing AI assistants with full access to remote monitoring and management through the NinjaOne REST API v2.

## Features

**19 tools** across five categories:

### Device Management
| Tool | Description |
|------|-------------|
| `list_devices` | List all managed devices with online status, OS, organization, and last contact |
| `get_device` | Get detailed device info including hardware, agent version, and network details |
| `get_device_activities` | Get recent activity log for a device (alerts, scripts, status changes) |
| `get_device_os_patch_status` | View pending, installed, and failed OS patches for a device |
| `get_device_software` | List all installed software on a device |
| `get_device_processor_info` | Get CPU/processor details for a device |
| `get_device_disks` | Get disk/storage info including capacity and free space |

### Organizations
| Tool | Description |
|------|-------------|
| `list_organizations` | List all organizations (clients/customers) with ID, name, and node count |
| `get_organization` | Get detailed organization info including contacts, tags, and policy assignments |
| `list_organization_devices` | List all devices belonging to a specific organization |
| `get_organization_locations` | Get configured locations for an organization |
| `get_organization_policies` | Get policy assignments for an organization |

### Alerts & Conditions
| Tool | Description |
|------|-------------|
| `list_alerts` | List active alerts across all devices, filterable by severity |
| `list_device_alerts` | List all active alerts for a specific device |
| `reset_alert` | Reset (acknowledge and clear) an active alert by its UID |
| `list_alert_conditions` | List all configured alert trigger conditions |

### Maintenance Windows
| Tool | Description |
|------|-------------|
| `list_maintenance_windows` | List all scheduled maintenance windows |
| `create_maintenance_window` | Create a maintenance window for a device to suppress alerts |
| `cancel_device_maintenance` | Cancel an active maintenance window to re-enable alerting |

### Jobs & Automation
| Tool | Description |
|------|-------------|
| `list_running_jobs` | List currently running jobs across all devices |
| `get_device_jobs` | Get all jobs (running, completed, failed) for a specific device |
| `run_script_on_device` | Execute a saved script on a device |

## Installation

```bash
git clone git@github.com:fredriksknese/mcp-ninjaone.git
cd mcp-ninjaone
npm install
npm run build
```

## Configuration

The server is configured via environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NINJAONE_CLIENT_ID` | Yes | OAuth2 client ID from NinjaOne API credentials |
| `NINJAONE_CLIENT_SECRET` | Yes | OAuth2 client secret from NinjaOne API credentials |
| `NINJAONE_INSTANCE` | Yes | NinjaOne instance hostname (see table below) |

### Instance Hostnames

| Region | Hostname |
|--------|----------|
| US | `app.ninjarmm.com` |
| EU | `eu.ninjarmm.com` |
| Oceania | `oc.ninjarmm.com` |
| Canada | `ca.ninjarmm.com` |

### Creating API Credentials

1. Log in to your NinjaOne instance
2. Navigate to **Administration > Apps > API**
3. Click **Add** to create a new API application
4. Select **Client Credentials** as the authorization flow
5. Grant the required scopes: `monitoring`, `management`, `control`, `offline_access`
6. Copy the **Client ID** and **Client Secret**

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ninjaone": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-ninjaone/dist/index.js"],
      "env": {
        "NINJAONE_CLIENT_ID": "your-client-id",
        "NINJAONE_CLIENT_SECRET": "your-client-secret",
        "NINJAONE_INSTANCE": "app.ninjarmm.com"
      }
    }
  }
}
```

## Usage with Claude Code

Add to your Claude Code MCP settings:

```bash
claude mcp add ninjaone -- node /absolute/path/to/mcp-ninjaone/dist/index.js
```

Set the required environment variables before running, or configure them in your MCP settings.

## Example Prompts

Once connected, you can ask your AI assistant things like:

- *"Show me all devices that are currently offline"*
- *"What active alerts do we have across all organizations?"*
- *"Put device 1234 into maintenance mode for the next 2 hours"*
- *"List all devices for the Acme Corp organization"*
- *"What software is installed on device 5678?"*
- *"Show me recent activity for device 1234"*
- *"Run the cleanup script on device 9012"*
- *"What jobs are currently running across all devices?"*
- *"Reset all minor alerts for device 1234"*
- *"What patches are pending on device 5678?"*

## Development

```bash
npm run dev      # Run with tsx (auto-reloads)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled output
```

## Architecture

```
src/
├── index.ts                # Entry point — creates MCP server + STDIO transport
├── ninjaone-client.ts      # HTTP client with OAuth2 client credentials flow
└── tools/
    ├── devices.ts          # Device management and inventory (7 tools)
    ├── organizations.ts    # Organization/client management (5 tools)
    ├── alerts.ts           # Alert monitoring and acknowledgement (4 tools)
    ├── maintenance.ts      # Maintenance window management (3 tools)
    └── jobs.ts             # Job execution and monitoring (3 tools)
```

The client handles OAuth2 token lifecycle automatically — tokens are fetched on first use and refreshed when they expire (typically after 1 hour).

## Requirements

- Node.js 18+
- NinjaOne account with API access enabled

## License

SEE LICENSE IN LICENSE
