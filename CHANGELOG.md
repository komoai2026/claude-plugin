# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial monorepo scaffold: `@kolmopdf/mcp-server` package, Claude Code plugin,
  KolmoPDF skill, marketplace entry, Codex CLI skill mirror, CI/CD workflows.

## [1.1.0] — 2026-08-08

### Changed

- MCP client targets **Jobs API v1** (`/api/v1/jobs/*`, `/api/v1/balance`) instead of legacy proxy.
- Polling accepts `succeeded` / `queued` (still tolerates legacy `completed` / `pending` / `waiting`).
- Create requests send `Idempotency-Key`; parse supports optional `enrichment` passthrough.
- Download sniffs ZIP magic so `images_as_url` + enrichment sidecars do not corrupt `result.md`.
- ZIP extract picks primary markdown via heuristic (excludes outline/summary/verification sidecars).
- `getStatus.success` is true only for succeeded/completed (not cancelled).
- Skill rewritten **API-first** (curl Jobs v1); MCP tools optional; glossary documents enrichment.
- Package / plugin version `1.1.0`.
