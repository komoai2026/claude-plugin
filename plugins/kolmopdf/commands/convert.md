---
description: Convert Markdown to DOCX, HTML, PDF, or LaTeX (KolmoPDF).
argument-hint: <markdown-or-zip-path> [--format word|docx|html|pdf|latex|tex]
allowed-tools: Bash, Read, Write, mcp__kolmopdf__kolmopdf_convert_markdown, mcp__kolmopdf__kolmopdf_estimate_cost, mcp__kolmopdf__kolmopdf_check_balance
---

Follow `../skills/kolmopdf/SKILL.md` relative to this command file.

Convert the supplied Markdown or ZIP. Default format: `word`.

Use `/api/v1/jobs/convert` with `file` and `targetFormat`, or `kolmopdf_convert_markdown` with `file_path` and `target_format`. Return the result path.

Arguments: $ARGUMENTS
