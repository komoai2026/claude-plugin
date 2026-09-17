---
description: Show KolmoPDF account credit balance.
allowed-tools: Bash, Read, mcp__kolmopdf__kolmopdf_check_balance
---

Call `GET https://www.kolmopdf.com/api/v1/balance` with `Authorization: Bearer $KOLMOPDF_API_KEY` from the environment, or use `kolmopdf_check_balance`. Report the returned balance.
