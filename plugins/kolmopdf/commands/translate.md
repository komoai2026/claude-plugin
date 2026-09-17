---
description: Translate a PDF while preserving its original layout (KolmoPDF).
argument-hint: <file-path> [--from <lang>] [--to <lang>] [--mode translated_only|side_by_side]
allowed-tools: Bash, Read, Write, mcp__kolmopdf__kolmopdf_translate_pdf, mcp__kolmopdf__kolmopdf_estimate_cost, mcp__kolmopdf__kolmopdf_check_balance
---

Read the KolmoPDF skill at `../skills/kolmopdf/SKILL.md` relative to this command file and follow its cost and download protocol.

1. Parse the path and flags from $ARGUMENTS. Defaults: `--from en`, `--to zh`, `--mode translated_only`.
2. Estimate 2 credits/page and check balance. Confirm once if the total exceeds 50 credits or cannot be estimated, unless already approved. Do not require the user to repeat the request with a provider name. Respect any no-upload constraint.
3. Use `POST /api/v1/jobs/translate-pdf` via Bash/curl with the camelCase form fields in the skill's chain recipes, or optional `kolmopdf_translate_pdf` with snake_case arguments. Do not require MCP installation.
4. Wait for success and download using result metadata. Check the actual file kind; multiple layouts may return ZIP. Report the downloaded/extracted paths, not an assumed PDF path.

Arguments: $ARGUMENTS
