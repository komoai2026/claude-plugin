---
description: Translate a PDF while preserving its original layout (KolmoPDF).
argument-hint: <file-path> [--from <lang>] [--to <lang>] [--mode translated_only|side_by_side]
allowed-tools: Bash, Read, Write, mcp__kolmopdf__kolmopdf_translate_pdf, mcp__kolmopdf__kolmopdf_estimate_cost, mcp__kolmopdf__kolmopdf_check_balance
---

Follow `../skills/kolmopdf/SKILL.md` relative to this command file.

Translate the supplied PDF. Defaults: `--from en`, `--to zh`, `--mode translated_only`.

Use `/api/v1/jobs/translate-pdf` with `sourceLanguage`, `targetLanguage`, and `layoutModes`, or `kolmopdf_translate_pdf` with the corresponding snake_case arguments. Return the downloaded or extracted PDF paths.

Arguments: $ARGUMENTS
