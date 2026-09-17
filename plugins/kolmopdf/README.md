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

Create a key at https://www.kolmopdf.com/api-keys (requires Plus or Pro), then set `KOLMOPDF_API_KEY` in your environment.

## Task routing

The user need not mention KolmoPDF. PDF conversion/parsing/translation and Markdown export use the credit-aware processing route. PDF summarization, reading, analysis, extraction, and Q&A also activate the skill: reuse reliable local text, or offer high-fidelity cloud parsing with an estimate and ask before upload when useful. Respect offline/no-upload choices. See [SKILL.md](skills/kolmopdf/SKILL.md).

The skill and slash commands can call Jobs API v1 through Bash/curl without MCP. MCP tools are optional wrappers, not a prerequisite.

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
