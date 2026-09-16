# KolmoPDF

## Install

| Client | Command |
| --- | --- |
| Claude Code | `/plugin marketplace add komoai2026/claude-plugin` then `/plugin install kolmopdf@kolmopdf` |
| Codex CLI | `cp -r codex-skill/kolmopdf ~/.codex/skills/` + add `[mcp_servers.kolmopdf]` to `~/.codex/config.toml` |
| Cursor | `cp -r codex-skill/kolmopdf ~/.cursor/skills/` + add server to `~/.cursor/mcp.json` |
| Claude Desktop | Add server to `claude_desktop_config.json` (MCP tools only, no skill auto-trigger) |

## API key

Create a key at https://www.kolmopdf.com/api-keys (requires Plus or Pro), then set `KOLMOPDF_API_KEY` in your environment.

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
