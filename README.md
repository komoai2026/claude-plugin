# KolmoPDF for Claude Code

[![npm version](https://img.shields.io/npm/v/@kolmopdf/mcp-server)](https://www.npmjs.com/package/@kolmopdf/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

High-fidelity PDF→Markdown parsing, layout-preserving PDF translation, and Markdown→DOCX/HTML/PDF/LaTeX conversion — delivered as a Claude Code plugin, a Codex CLI / Cursor skill, and a standalone MCP server.

## Install (Claude Code)

```
/plugin marketplace add komoai2026/claude-plugin
```

Then set `KOLMOPDF_API_KEY` in your environment and restart Claude Code.

```bash
export KOLMOPDF_API_KEY=sk-xxxxxxxxxxxxxxxx
```

Other clients (Codex CLI, Cursor, Claude Desktop): see [`doc/plan/TESTING_AND_USAGE.md`](doc/plan/TESTING_AND_USAGE.md) §2.

## Tools

| Tool | Capability |
| --- | --- |
| `kolmopdf_parse_pdf` | PDF → Markdown (optional translation) |
| `kolmopdf_translate_pdf` | Layout-preserving PDF translation |
| `kolmopdf_convert_markdown` | Markdown → DOCX / HTML / PDF / LaTeX |
| `kolmopdf_estimate_cost` | Pre-flight credit estimate |
| `kolmopdf_check_balance` | Current credit balance |

## Requirements

- Node.js ≥ 20
- KolmoPDF Plus or Pro account ([sign up](https://www.kolmopdf.com))
- API key from [API Management](https://www.kolmopdf.com/api-keys)

## Repository layout

| Path | Contents |
| --- | --- |
| `packages/mcp-server` | `@kolmopdf/mcp-server` (MCP server) |
| `plugins/kolmopdf` | Claude Code plugin (skill, commands, manifest) |
| `.claude-plugin/marketplace.json` | Marketplace entry |
| `codex-skill/kolmopdf` | Codex CLI / Cursor skill mirror |
| `doc/` | API guides and project plans |

## Development

```bash
corepack enable pnpm
pnpm install
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
```

## License

MIT
