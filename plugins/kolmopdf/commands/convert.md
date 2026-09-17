---
description: Convert Markdown to DOCX, HTML, PDF, or LaTeX (KolmoPDF).
argument-hint: <markdown-or-zip-path> [--format word|docx|html|pdf|latex|tex]
allowed-tools: Bash, Read, Write, mcp__kolmopdf__kolmopdf_convert_markdown, mcp__kolmopdf__kolmopdf_estimate_cost, mcp__kolmopdf__kolmopdf_check_balance
---

Read the KolmoPDF skill at `../skills/kolmopdf/SKILL.md` relative to this command file and follow its cost and download protocol.

1. Parse the Markdown/ZIP path and target format. Default: `word`.
2. Estimate 1 credit per conversion and check balance; use the whole workflow or batch total for the 50-credit confirmation threshold. Respect any no-upload constraint.
3. Use `POST /api/v1/jobs/convert` via Bash/curl with `file` and `targetFormat`, or optional `kolmopdf_convert_markdown` with `file_path` and `target_format`. Do not require MCP installation or a repeated provider-name request.
4. Wait for success and download using the declared filename/kind. Report the actual result path.

Arguments: $ARGUMENTS
