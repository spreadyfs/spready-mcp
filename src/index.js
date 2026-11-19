#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const apiKey = process.env.SPREADY_API_KEY || argValue("--key");
const baseUrl = (process.env.SPREADY_BASE_URL || "https://spready.bitscorp.co").replace(/\/$/, "");

if (!apiKey) {
  console.error("SPREADY_API_KEY (or --key) is required");
  process.exit(1);
}

const providers = z
  .array(z.string())
  .describe(
    "Channel slugs. linkedin, x, threads, instagram, facebook, bluesky, mastodon, pinterest, tiktok, youtube, google-business-profile, substack. The channel must already be connected."
  );

const server = new McpServer({
  name: "spready",
  version: "0.1.0"
});

server.tool(
  "list_networks",
  "List the channels Spready can publish to, including LinkedIn, and the publishing rules for each",
  {},
  async () => jsonResult(await api("GET", "/api/v1/networks"))
);

server.tool(
  "list_channels",
  "List the channels connected in this workspace",
  {},
  async () => jsonResult(await api("GET", "/api/v1/channels"))
);

server.tool(
  "list_integrations",
  "List the apps and integrations available on Spready",
  {},
  async () => jsonResult(await api("GET", "/api/v1/integrations"))
);

server.tool(
  "list_queue",
  "List upcoming posts in the queue",
  {},
  async () => jsonResult(await api("GET", "/api/v1/queue"))
);

server.tool(
  "list_posts",
  "List posts, optionally filtered by status",
  { status: z.string().optional().describe("draft, scheduled, sent, or needs_approval") },
  async (args) => jsonResult(await api("GET", "/api/v1/posts", null, args))
);

server.tool(
  "create_campaign",
  "Create a campaign: one post sent to one or more connected networks, including LinkedIn. Pass scheduled_at to put it on the queue. Instagram needs image_url.",
  {
    name: z.string().optional().describe("A label for this campaign"),
    body: z.string().describe("The post text"),
    providers,
    scheduled_at: z.string().optional().describe("ISO-8601 time. Omit to leave a draft."),
    image_url: z.string().optional().describe("Image URL. Required when instagram is included."),
    first_comment: z.string().optional()
  },
  async (args) => jsonResult(await api("POST", "/api/v1/campaigns", args))
);

server.tool(
  "save_idea",
  "Save an idea that is not a post yet",
  {
    title: z.string(),
    body: z.string().optional()
  },
  async (args) => jsonResult(await api("POST", "/api/v1/ideas", args))
);

server.tool("list_ideas", "List saved ideas", {}, async () =>
  jsonResult(await api("GET", "/api/v1/ideas"))
);

server.tool(
  "insights_summary",
  "Summarize impressions and engagements for a date range",
  {
    from: z.string().optional().describe("YYYY-MM-DD"),
    to: z.string().optional().describe("YYYY-MM-DD")
  },
  async (args) => jsonResult(await api("GET", "/api/v1/insights/summary", null, args))
);

const transport = new StdioServerTransport();
await server.connect(transport);

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function api(method, path, body, query) {
  const url = new URL(baseUrl + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${apiKey}`,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: "invalid_response", message: text.slice(0, 500) };
  }

  if (!response.ok) {
    const message = payload.message || payload.error || `HTTP ${response.status}`;
    return { ok: false, status: response.status, message, ...payload };
  }

  return payload;
}

function jsonResult(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }]
  };
}
