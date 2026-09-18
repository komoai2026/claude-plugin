# KolmoPDF

## Install

| Client | Command |
| --- | --- |
| Claude Code | `/plugin marketplace add komoai2026/claude-plugin` then `/plugin install kolmopdf@kolmopdf` |
| Standalone skill (no MCP required) | `npx skills add komoai2026/kolmopdf-skill` |
| Codex CLI | Copy `codex-skill/kolmopdf` from the repository root to `~/.codex/skills/`; MCP registration is optional |
| Cursor | Copy `codex-skill/kolmopdf` from the repository root to `~/.cursor/skills/`; MCP registration is optional |
| Claude Desktop | Add server to `claude_desktop_config.json` (MCP tools only, no skill auto-trigger) |

## API key

Create a key at https://www.kolmopdf.com/api-keys, then configure `KOLMOPDF_API_KEY` privately in the environment used to launch your agent. A subscription is not required: Free, PAYG, Go, and Plus support one key; Pro supports up to ten. Web, API, and MCP share credits. If needed, buy one-time credits at https://www.kolmopdf.com/credits.

Do not paste the key into a conversation or commit it to a project. An already-running agent does not inherit changes made in another terminal; restart from the configured environment or use the client's private settings. Check setup with the balance tool, not a paid document-processing job.

## Usage

Supports PDF conversion, translation, reading, summaries, analysis, and Q&A. See [SKILL.md](skills/kolmopdf/SKILL.md) for routing, cost, and API instructions.

## Tools

| Tool | Capability |
| --- | --- |
| `kolmopdf_parse_pdf` | PDF → Markdown (optional translation) |
| `kolmopdf_translate_pdf` | Layout-preserving PDF translation |
| `kolmopdf_convert_markdown` | Markdown → DOCX / HTML / PDF / LaTeX |
| `kolmopdf_estimate_cost` | Pre-flight credit estimate |
| `kolmopdf_check_balance` | Current credit balance |

## License

MIT
