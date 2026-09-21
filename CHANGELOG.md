# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.2] — 2026-09-21

### Fixed

- Replaced the Skill's `jq` and GNU `timeout` dependency with a bundled Node.js Jobs API helper that runs on macOS, Linux, and Windows.
- Made MCP output paths stable under the user's home directory and blocked output/ZIP paths that escape the configured root.
- Treat unexpanded `${KOLMOPDF_API_KEY}` placeholders as a missing key instead of sending the placeholder to the API.
- Derive `--version` from the package version during the build instead of a stale hard-coded constant.
- Added Apple Silicon and Intel macOS CI coverage plus Windows/Linux, real Claude plugin validation, Unicode/path tests, and packaged helper tests.
- Added macOS CLI, IDE, and Claude Desktop setup guidance for `npx`, environment variables, and output paths.
- Preserved DOCX outputs instead of renaming their ZIP container to `.zip`, and documented correct helper paths for Claude Code, Codex, and Cursor.
- Updated API-key and credit remediation for Free/PAYG accounts, one-time credit purchases, and safe confirmation boundaries.

## [1.2.1] — 2026-09-17

### Changed

- Consolidated task routing, costs, and API instructions in the main skill.
- Shortened recipes, commands, and READMEs to their operational purpose.
- Made balance queries conditional and file-signature checks troubleshooting-only.
- Preserved conversion and reading routes, cost approval, direct API support, and synchronized skill distributions.

MCP runtime source is unchanged; its version follows the plugin release.

## [1.2.0] — 2026-09-17

### Fixed

- Removed the brand-name gate: ordinary PDF conversion/parsing/translation and Markdown export requests activate KolmoPDF.
- PDF summarization, reading, analysis, extraction, and Q&A now activate the skill and assess whether existing/local text is sufficient or cloud parsing should be offered.
- Reading tasks obtain one approval covering cloud parsing and estimated cost when useful, rather than silently skipping KolmoPDF or automatically uploading every PDF.
- Cost confirmation applies to the total workflow/batch; previously approved scope is not confirmed again. Offline/no-upload and explicit provider choices are respected.
- Chain recipes and all four slash commands work through the direct Jobs API without requiring MCP.
- Removed placeholder-key overwrites from the executable parse example and clarified server artifacts versus agent-written summaries.
- Synchronized the plugin skill, Codex/Cursor mirror, standalone distribution, installation guidance, and routing scenarios; marked legacy design documents as historical.

MCP runtime source and API implementations are unchanged. The package version follows the coordinated plugin release.

## [1.1.1] — 2026-09-16

### Changed

- Documented the required two-step Claude Code installation flow: add the marketplace, then install the plugin.
- Standardized repository links on `komoai2026/claude-plugin` and linked the standalone `kolmopdf-skill` distribution.
- Marked the workspace root as a private monorepo package with a distinct package name.
- Standardized the default branch on `main` and removed the redundant tag-only workflow.

### Content

- KolmoPDF tools, skill instructions, and API behavior are unchanged.

## [1.1.0] — 2026-08-21

### Changed

- MCP client targets **Jobs API v1** (`/api/v1/jobs/*`, `/api/v1/balance`) instead of legacy proxy.
- Polling accepts `succeeded` / `queued` (still tolerates legacy `completed` / `pending` / `waiting`).
- Create requests send `Idempotency-Key`; parse supports optional `enrichment` passthrough.
- Download sniffs ZIP magic so `images_as_url` + enrichment sidecars do not corrupt `result.md`.
- ZIP extract picks primary markdown via heuristic (excludes outline/summary/verification sidecars).
- `getStatus.success` is true only for succeeded/completed (not cancelled).
- Skill rewritten **API-first** (curl Jobs v1); MCP tools optional; glossary documents enrichment.
- Package / plugin version `1.1.0`.

## [1.0.0] — 2026-05-22

### Added

- Initial monorepo scaffold: `@kolmopdf/mcp-server`, Claude Code plugin, KolmoPDF skill, marketplace entry, Codex CLI skill mirror, and CI/CD workflows.
