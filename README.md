# KolmoPDF for Claude Code

[![npm version](https://img.shields.io/npm/v/@kolmopdf/mcp-server)](https://www.npmjs.com/package/@kolmopdf/mcp-server)
[![GitHub release](https://img.shields.io/github/v/release/komoai2026/claude-plugin)](https://github.com/komoai2026/claude-plugin/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

High-fidelity PDF→Markdown parsing, layout-preserving PDF translation, and Markdown→DOCX/HTML/PDF/LaTeX conversion — delivered as a Claude Code plugin, a Codex CLI / Cursor skill, and a standalone MCP server.

## Install (Claude Code)

Adding a marketplace and installing a plugin are separate steps:

```text
/plugin marketplace add komoai2026/claude-plugin
/plugin install kolmopdf@kolmopdf
```

Set `KOLMOPDF_API_KEY` in your environment, then restart Claude Code:

```bash
export KOLMOPDF_API_KEY=sk-xxxxxxxxxxxxxxxx
```

Other clients (Codex CLI, Cursor, Claude Desktop): see [`doc/plan/TESTING_AND_USAGE.md`](doc/plan/TESTING_AND_USAGE.md) §2.

The standalone skill is also available from [`komoai2026/kolmopdf-skill`](https://github.com/komoai2026/kolmopdf-skill).

## Task routing (no brand name required)

| Request | Behavior |
| --- | --- |
| "把PDF转成Markdown", PDF parsing/OCR, PDF translation, Markdown export | Uses KolmoPDF with a cloud/credit estimate; no requirement to name the service. Confirms once above 50 credits or if cost is unknown. |
| "总结这个PDF", read/analyze a paper, extract tables, PDF Q&A | Activates the skill. Reuses adequate text; offers high-fidelity cloud parsing with an estimate when structure/extraction quality warrants it and asks before upload. |
| Simple, fully readable local PDF or existing Markdown | Reads locally without unnecessary paid parsing. |
| Offline/no upload, or another provider explicitly selected | Respects the user's choice; does not upload to KolmoPDF. |

Skill activation and a paid API call are separate decisions. For reading tasks, approving cloud parsing and its total estimate once is sufficient. After parsing, the agent completes the requested summary or analysis, not just a file conversion.

### Without MCP

```bash
npx skills add komoai2026/kolmopdf-skill
```

Configure `KOLMOPDF_API_KEY` in the agent's shell environment. The standalone skill uses Jobs API v1 directly through Bash/curl; MCP is optional. See the [skill instructions](plugins/kolmopdf/skills/kolmopdf/SKILL.md) and [chain recipes](plugins/kolmopdf/skills/kolmopdf/references/chain-recipes.md).

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

[MIT](LICENSE)
