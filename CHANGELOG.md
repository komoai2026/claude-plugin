# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
