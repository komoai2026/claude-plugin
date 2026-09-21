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

On macOS, Terminal exports reach only processes started from that Terminal. Finder/Dock-launched IDE or Desktop sessions need their own private MCP environment. If a GUI client reports `spawn npx ENOENT`, run `command -v npx` and use the returned absolute path in its MCP configuration.

MCP outputs default to `~/kolmopdf-output/<task_id>/`. Set `KOLMOPDF_OUTPUT_DIR` to another writable absolute path when needed.

## Usage

Supports PDF conversion, translation, reading, summaries, analysis, and Q&A. See [SKILL.md](skills/kolmopdf/SKILL.md) for routing and cost rules. When MCP is unavailable, the bundled `skills/kolmopdf/scripts/jobs.mjs` helper runs the Jobs API on Node.js 20+ without `jq` or GNU `timeout`.

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
