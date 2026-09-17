---
description: Parse a PDF to Markdown via KolmoPDF (handles formulas, tables, multi-column).
argument-hint: <file-path> [--translate] [--target-lang zh|en|ja|ko|fr|de|es|ru]
allowed-tools: Bash, Read, Write, mcp__kolmopdf__kolmopdf_parse_pdf, mcp__kolmopdf__kolmopdf_estimate_cost, mcp__kolmopdf__kolmopdf_check_balance
---

Read the KolmoPDF skill at `../skills/kolmopdf/SKILL.md` relative to this command file and follow its cost and download protocol.

1. This command explicitly requests parsing. Do not require another brand-name or service-selection confirmation. Respect any no-upload constraint.
2. Estimate parse at 2 credits/page, or parse+translation at 3 credits/page; check balance. Confirm once if the total exceeds 50 credits or cannot be estimated, unless already approved.
3. If `--translate` was passed, set `enable_translation=true` and the requested target language (default `zh`) with `output_options=bilingual`.
4. Use Jobs API v1 via Bash/curl, or `kolmopdf_parse_pdf` if available. MCP installation is not required. Reuse the configured API key.
5. Wait for success, download by result metadata, extract ZIP if needed, and report the primary Markdown path and a brief preview. Do not invent output paths or sidecars.

Arguments: $ARGUMENTS
