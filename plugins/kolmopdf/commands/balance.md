---
description: Show KolmoPDF account credit balance.
allowed-tools: Bash, Read, mcp__kolmopdf__kolmopdf_check_balance
---

Use `kolmopdf_check_balance` if available. Otherwise use Bash/curl to call `GET https://www.kolmopdf.com/api/v1/balance` with `Authorization: Bearer $KOLMOPDF_API_KEY` from the environment. MCP installation is not required. If the key is missing, direct the user to configure it; do not print the key or replace it with a placeholder.

Report the returned balance briefly. This read-only request does not consume processing credits.
