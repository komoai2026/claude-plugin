---
description: Parse a PDF to Markdown via KolmoPDF (handles formulas, tables, multi-column).
argument-hint: <file-path> [--translate] [--target-lang zh|en|ja|ko|fr|de|es|ru]
allowed-tools: Bash, Read, Write, mcp__kolmopdf__kolmopdf_parse_pdf, mcp__kolmopdf__kolmopdf_estimate_cost, mcp__kolmopdf__kolmopdf_check_balance
---

Follow `../skills/kolmopdf/SKILL.md` relative to this command file.

Parse the supplied PDF. With `--translate`, set `enable_translation=true`, `target_language` from `--target-lang` (default `zh`), and `output_options=bilingual`.

Use `/api/v1/jobs/parse` or `kolmopdf_parse_pdf`. Return the primary Markdown path and a brief preview.

Arguments: $ARGUMENTS
