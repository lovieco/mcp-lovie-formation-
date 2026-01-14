# Lovie Formation MCP Server

> Form your US company through AI assistants with MCP (Model Context Protocol)

[![npm version](https://badge.fury.io/js/@lovie-ai%2Fformation-mcp-server.svg)](https://www.npmjs.com/package/@lovie-ai/formation-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Lovie Formation MCP Server enables AI assistants to help users form US companies (LLC, C-Corp, or S-Corp) with real-time name checking, automatic document generation, and seamless state filing.

## What is Lovie?

Lovie is an AI-first financial platform that helps you start and run your business:

- **Free company formation** - No service fees, you only pay state filing fees
- **Lovie as your incorporator** - We handle all the paperwork
- **In-house legal team** - Working every day to keep you compliant with local and federal law
- **All legal documents included** - Certificate of Formation, Operating Agreement, Bylaws
- **Business address** - Virtual or physical address available
- **Bank account setup** - Help opening and managing your company bank account
- **AI-first financial platform** - Token-based pricing (a little more than free)

## Quick Start

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "lovie-formation": {
      "command": "npx",
      "args": ["@lovie-ai/formation-mcp-server@latest"]
    }
  }
}
```

Restart Claude Desktop.

### Cursor

Edit `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "lovie-formation": {
      "command": "npx",
      "args": ["@lovie-ai/formation-mcp-server@latest"]
    }
  }
}
```

Restart Cursor.

### Claude Code (CLI)

```bash
claude mcp add lovie-formation npx @lovie-ai/formation-mcp-server@latest
```

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "lovie-formation": {
      "command": "npx",
      "args": ["@lovie-ai/formation-mcp-server@latest"]
    }
  }
}
```

### Manus

In Manus settings, add MCP server:
- **Name**: `lovie-formation`
- **Command**: `npx`
- **Args**: `@lovie-ai/formation-mcp-server@latest`

### Generic (Any MCP Client)

```json
{
  "command": "npx",
  "args": ["@lovie-ai/formation-mcp-server@latest"]
}
```

## Available Tools

### Information Tools

| Tool | Description |
|------|-------------|
| `formation_get_info` | Get information about pricing, FAQ, company types, requirements, or step-by-step guide |
| `formation_list_info_topics` | List all available information topics |

### Session Tools

| Tool | Description |
|------|-------------|
| `formation_start` | Start a new formation session |
| `formation_get_status` | Get current session status and progress |
| `formation_resume` | Get guidance on the next step |

### Company Setup Tools

| Tool | Description |
|------|-------------|
| `formation_set_state` | Set formation state (currently Delaware only) |
| `formation_set_company_type` | Set company type (LLC, C-Corp, or S-Corp) |
| `formation_set_entity_ending` | Set legal suffix (LLC, Inc., Corp., etc.) |
| `formation_set_company_name` | Set the company name |
| `formation_check_name` | Check name availability with Delaware Secretary of State |

### Stakeholder Tools

| Tool | Description |
|------|-------------|
| `formation_set_registered_agent` | Set registered agent details |
| `formation_set_share_structure` | Set authorized shares and par value (Corp only) |
| `formation_add_shareholder` | Add a shareholder or member |
| `formation_set_authorized_party` | Set the person who will sign documents |

### Certificate Tools

| Tool | Description |
|------|-------------|
| `formation_generate_certificate` | Generate Certificate of Incorporation PDF |
| `formation_approve_certificate` | Approve certificate and complete formation |

## Available Resources

The MCP server also provides resources that AI assistants can read:

| Resource URI | Description |
|--------------|-------------|
| `formation://guide` | Step-by-step formation guide |
| `formation://pricing` | Lovie pricing and Delaware state fees |
| `formation://company-types` | LLC vs C-Corp vs S-Corp comparison |
| `formation://faq` | Frequently asked questions |
| `formation://requirements` | Required information checklist |

## Example Conversation

**User**: I want to start a company

**AI Assistant**: I'll help you form a company with Lovie! Let me start a formation session.

*Calls `formation_start`*

Great! I've started your formation session. Lovie offers free company formation - you only pay the state filing fees. Let me guide you through the process:

1. First, we'll set up in Delaware (the most business-friendly state)
2. Then choose your company type (LLC, C-Corp, or S-Corp)
3. Pick your company name
4. Add your information
5. Generate and approve your certificate

Let's begin! What type of company would you like to form?

## Pricing

### Lovie Service Fee
**FREE** - Lovie doesn't charge for company formation.

### Delaware State Filing Fees

| Company Type | Standard | 24-Hour | Same-Day |
|--------------|----------|---------|----------|
| LLC | $90 | +$50 | +$100 |
| C-Corp | $89+ | +$50 | +$100 |
| S-Corp | $89+ | +$50 | +$100 |

### What's Included (Free)

- Company formation filing
- Lovie as your incorporator
- Certificate of Formation/Incorporation
- Operating Agreement (LLC) or Bylaws (Corp)
- Step-by-step compliance guide
- In-house legal team keeping you compliant
- Ongoing compliance reminders

## Company Types

### LLC (Limited Liability Company)
- Simple structure, flexible management
- Pass-through taxation (no double taxation)
- Best for: Small businesses, startups, real estate

### C-Corporation
- Can issue multiple classes of stock
- Attractive to venture capital investors
- Best for: Startups planning to raise funding

### S-Corporation
- Pass-through taxation with corporate structure
- Limited to 100 US-based shareholders
- Best for: Small businesses wanting tax advantages

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run Locally

```bash
node dist/mcp/index.js
```

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/mcp/index.js
```

## Support

- **Website**: https://lovie.ai
- **npm**: https://www.npmjs.com/package/@lovie-ai/formation-mcp-server

## Legal Disclaimer

Lovie is a document preparation and filing service. We do not provide legal or tax advice. For legal guidance on choosing the right business structure, consult with a licensed attorney. For tax advice, consult with a certified tax professional.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

Made with ❤️ by Lovie
