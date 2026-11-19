# Spready MCP

An MCP server for [Spready](https://spready.bitscorp.co). It lets an assistant set up a campaign and send it to the channels already connected in a workspace, including LinkedIn, and list the integrations Spready ships with.

The server speaks stdio. Spready itself also accepts the same actions at `POST /mcp` with a bearer key.

## Setup

1. Open Spready and create an API key under Settings → API. The demo workspace is [https://spready.bitscorp.co/auth/demo](https://spready.bitscorp.co/auth/demo).
2. Connect the channels the campaign should use. LinkedIn is `linkedin`.
3. Point the client at this server.

```json
{
  "mcpServers": {
    "spready": {
      "command": "npx",
      "args": ["-y", "github:spreadyfs/spready-mcp"],
      "env": {
        "SPREADY_API_KEY": "sp_...",
        "SPREADY_BASE_URL": "https://spready.bitscorp.co"
      }
    }
  }
}
```

`SPREADY_BASE_URL` defaults to `https://spready.bitscorp.co`.

From a checkout:

```bash
npm install
SPREADY_API_KEY=sp_... node src/index.js
```

## Tools

| Tool | What it does |
| --- | --- |
| `list_networks` | Channels Spready can publish to, with post types and limits. LinkedIn is included. |
| `list_channels` | Channels connected in this workspace. |
| `list_integrations` | Apps in the catalog (native, MCP, webhook, and API). |
| `list_queue` | Posts waiting to go out. |
| `list_posts` | Posts, with an optional status. |
| `create_campaign` | One post, many networks. `providers` is a list of slugs such as `linkedin`, `x`, `threads`, `instagram`. Pass `scheduled_at` to queue it. Instagram needs `image_url`. |
| `save_idea` | Keep a note that is not a post yet. |
| `list_ideas` | Saved ideas. |
| `insights_summary` | Impressions and engagements for a date range. |

A channel that is not connected comes back as an error naming that slug. Connect it in the app, then call `create_campaign` again.

Example: a LinkedIn and X campaign for tomorrow.

```json
{
  "name": "Launch week",
  "body": "The queue is the product.",
  "providers": ["linkedin", "x"],
  "scheduled_at": "2026-11-20T15:00:00Z"
}
```
