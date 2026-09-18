# KolmoPDF Claude Plugin — 社区分发规范

> **历史分发计划，不是当前发布状态或 Skill 触发规范。** 下文宣传模板、目录规则和首发清单保留供参考；当前安装与路由以 [README](../../README.md) 和 [SKILL.md](../../plugins/kolmopdf/skills/kolmopdf/SKILL.md) 为准，正式版本以 GitHub Releases 为准。
>
> 本文件覆盖：发布前置准备 → 自有 marketplace 上线 → 第三方目录提交清单 → Anthropic 官方提交 → 发布节奏。
> 所有清单都按"提交所需字段 / 提交入口 / 审核周期 / 用户安装命令"四要素结构化。

## 1. 发布前置 Checklist

发版当天，按顺序逐项打勾，缺一不可。

| # | 项 | 状态 |
|---|---|---|
| 1 | npm 组织 `@kolmopdf` 已注册并 access=public | ☐ |
| 2 | GitHub 账号 `komoai2026` 下的 `claude-plugin` 仓库已公开 | ☐ |
| 3 | `LICENSE` 文件存在（MIT） | ☐ |
| 4 | 顶层 `README.md` 完整 | ☐ |
| 5 | `.claude-plugin/marketplace.json` 通过 `claude plugin validate .` | ☐ |
| 6 | `plugins/kolmopdf/.claude-plugin/plugin.json` 通过 validate | ☐ |
| 7 | `plugins/kolmopdf/skills/kolmopdf/SKILL.md` frontmatter 合法 | ☐ |
| 8 | npm `@kolmopdf/mcp-server@1.0.0` 已发布 | ☐ |
| 9 | Git tag `v1.0.0` 已 push 并触发 release workflow 成功 | ☐ |
| 10 | GitHub Release 含 changelog + 安装命令 | ☐ |
| 11 | 内部全套 smoke test 通过（见 TESTING_AND_USAGE.md §3） | ☐ |
| 12 | 在 3 个真实客户端（Claude Code / Codex / Cursor）跑通 §2 安装命令 | ☐ |
| 13 | 准备好品牌资源（见 §2） | ☐ |

---

## 2. 品牌资源清单

供所有 marketplace 提交时复用，集中存放在 `assets/branding/`：

| 资源 | 规格 | 用途 | 来源 |
|---|---|---|---|
| `logo.svg` | 矢量 | 优先用于支持 SVG 的目录 | 由现有 PNG 转换 |
| `logo-256.png` | 256×256，透明背景 | 主流目录卡片 | https://github.com/Len12749/web_zhiyi_en/blob/master/public/img/logo.png 缩放 |
| `logo-512.png` | 512×512 | 高分屏 | 同上 |
| `screenshot-parse.png` | 1280×800 | demo 截图：parse 一篇 arxiv 后的 markdown 结果 | 自录 |
| `screenshot-translate.png` | 1280×800 | demo 截图：side-by-side 翻译结果 | 自录 |
| `tagline.txt` | ≤ 100 字符 | marketplace card 副标题 | 见下 |
| `short-description.txt` | ≤ 300 字符 | 列表页描述 | 见下 |
| `long-description.md` | 不限 | 详情页 / README 顶部 | 见下 |

### 2.1 Tagline（≤ 100 chars）

```
High-fidelity PDF→Markdown, layout-preserving PDF translation, and Markdown→DOCX/HTML/PDF/LaTeX.
```

### 2.2 Short description（≤ 300 chars）

```
KolmoPDF brings production-grade PDF intelligence to Claude Code and Codex CLI. Parse technical PDFs with accurate formula, table, and multi-column handling; translate PDFs while keeping the original layout; and convert Markdown into DOCX, HTML, PDF, or LaTeX — all via simple tool calls.
```

### 2.3 Long description (markdown)

```markdown
**KolmoPDF for Claude Code** gives your AI coding agent real eyes for PDFs.

The built-in `Read` tool caps at 20 pages and loses formulas, tables, and multi-column layout. KolmoPDF replaces it with a cloud-backed pipeline that:

- Parses PDFs up to **800 pages** with accurate **LaTeX formula** preservation (configurable `$...$` or `\(...\)` delimiters)
- Handles **multi-column** academic papers in correct reading order
- Merges **tables spanning page breaks**
- Produces clean Markdown plus an extracted assets folder (or self-contained URL-referenced markdown)
- Translates PDFs across 8 languages while **preserving the original layout**
- Converts Markdown to **DOCX, HTML, PDF, or LaTeX**

## Tools

- `kolmopdf_parse_pdf` — PDF → Markdown (with optional translation)
- `kolmopdf_translate_pdf` — Layout-preserving PDF translation
- `kolmopdf_convert_markdown` — Markdown → DOCX/HTML/PDF/LaTeX
- `kolmopdf_estimate_cost` — Pre-flight credit estimate
- `kolmopdf_check_balance` — Current credit balance

## Requirements

- Node.js ≥ 20
- KolmoPDF account ([sign up](https://www.kolmopdf.com)); no subscription required. Free/PAYG/Go/Plus: one API key; Pro: up to ten.
- API key from [API Management](https://www.kolmopdf.com/api-keys)

## Install (Claude Code)

```
/plugin marketplace add komoai2026/claude-plugin
/plugin install kolmopdf@kolmopdf
```

Then set `KOLMOPDF_API_KEY` in your environment and restart.

## License

MIT
```

---

## 3. 自有 Marketplace 上线（首发渠道）

### 3.1 仓库公开

```bash
# 在 GitHub 控制台
1. Create new public repository: komoai2026/claude-plugin
2. Push monorepo content
3. Set repo description: "KolmoPDF plugin for Claude Code — PDF parsing, translation, and format conversion."
4. Set repo website: https://www.kolmopdf.com
5. Set topics: claude-code, claude-plugin, mcp, mcp-server, pdf, pdf-to-markdown, kolmopdf
```

### 3.2 README 必须包含的 badges（顶部）

```markdown
[![npm version](https://img.shields.io/npm/v/@kolmopdf/mcp-server)](https://www.npmjs.com/package/@kolmopdf/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
```

### 3.3 用户安装命令

| 客户端 | 命令 |
|---|---|
| Claude Code | `/plugin marketplace add komoai2026/claude-plugin` then `/plugin install kolmopdf@kolmopdf` |
| Codex CLI | 见 TESTING_AND_USAGE.md §2.2 |
| Cursor | 见 TESTING_AND_USAGE.md §2.3 |
| Claude Desktop | 见 TESTING_AND_USAGE.md §2.4 |

### 3.4 验证

```bash
# 从另一台机器/容器：
claude plugin marketplace add komoai2026/claude-plugin
claude plugin install kolmopdf@kolmopdf
# 然后跑 TESTING_AND_USAGE.md §3 的全套验证
```

---

## 4. 第三方目录提交清单

按提交优先级排序。每家入口、字段、审核机制都不同，分别说明。

### 4.1 Anthropic Community Marketplace（最高优先级）

> 这是 Anthropic 官方维护的"社区"层，通过审核后可获得「community」标签。

| 项 | 值 |
|---|---|
| 提交入口 | https://clau.de/plugin-directory-submission |
| 上游仓库 | https://github.com/anthropics/claude-plugins-community （只读镜像，不接受 PR） |
| 审核机制 | 自动化校验 + 安全/质量人工审核 |
| 审核周期 | 1–4 周（节假日延后） |
| 提交后效果 | `claude plugin marketplace add anthropics/claude-plugins-community` → `claude plugin install kolmopdf@claude-community` 可直接安装 |

**提交表单需准备的字段**

| 字段 | 我们填写 |
|---|---|
| Plugin name | `kolmopdf` |
| GitHub repo URL | `https://github.com/komoai2026/claude-plugin` |
| Plugin path in repo | `plugins/kolmopdf` |
| Maintainer name | `KomoAI LLC` |
| Maintainer email | `support@kolmopdf.com` |
| Category | `document-processing` |
| Short description | 见 §2.2 |
| Long description | 见 §2.3 |
| License | MIT |
| Does plugin call external services? | Yes（需说明 KolmoPDF API、付费、用户需自带 key） |
| Does plugin handle user secrets? | Yes（KOLMOPDF_API_KEY） |
| Data privacy URL | https://www.kolmopdf.com/privacy-policy |
| Support URL | https://www.kolmopdf.com/contact |

**注意事项**

- 直接对 `anthropics/claude-plugins-community` 提 PR 会被自动关闭。
- 通过审核后每个 plugin 被 pin 到某个 commit SHA；后续每次升级需重新触发审核（细则随官方变化，关注 README）。

### 4.2 Anthropic Verified（终极信任标）

| 项 | 值 |
|---|---|
| 入口 | 同 §4.1 表单，但勾选 "Apply for Anthropic Verified" |
| 审核机制 | 上述自动+安全审核 + 额外质量复核 |
| 周期 | 4–8 周 |
| 收益 | Plugin 卡片显示 `Anthropic Verified` badge；优先曝光 |

**准入条件（按当前公开标准估计，最终以审核反馈为准）**

- 至少 30 天稳定运行无 critical issue
- README、安全声明、隐私政策齐全
- License 明确（MIT 通过）
- 工具行为与描述一致
- 不在 plugin 中存放凭据，由用户提供

### 4.3 claudemarketplaces.com

| 项 | 值 |
|---|---|
| 入口 | 自动从 GitHub 收录（topic + marketplace.json 即可被识别） |
| 主动提交 | https://claudemarketplaces.com/submit |
| 周期 | 1–3 天 |
| 提交字段 | GitHub URL + 一句话描述（直接复用 §2.1） |

### 4.4 agensi.io / skills marketplace

| 项 | 值 |
|---|---|
| 入口 | https://www.agensi.io/skills/submit |
| 周期 | 3–7 天 |
| 字段 | name, description, repo URL, categories, install command |
| 注意 | 该平台同时收录 Claude Code 和 Codex skill，提交时勾选两个平台 |

### 4.5 mcpmarket.com

| 项 | 值 |
|---|---|
| 入口 | https://mcpmarket.com/submit-skill 或 https://mcpmarket.com/submit-mcp |
| 周期 | 3–7 天 |
| 双重提交 | MCP server 走 `submit-mcp`，Skill 走 `submit-skill`，分别提交 |
| 字段 | name, description, repo URL, install snippet, category, tags |

### 4.6 skillsmp.com

| 项 | 值 |
|---|---|
| 入口 | https://skillsmp.com/submit |
| 周期 | 自动抓取 GitHub，约 24 小时 |
| 字段 | repo URL |

### 4.7 claudepluginhub.com

| 项 | 值 |
|---|---|
| 入口 | https://www.claudepluginhub.com/submit |
| 周期 | 1–3 天 |
| 字段 | name, description, GitHub repo, marketplace 名（填 `kolmopdf`） |

### 4.8 glama.ai（MCP 目录）

| 项 | 值 |
|---|---|
| 入口 | https://glama.ai/mcp/servers/new |
| 适用对象 | MCP server `@kolmopdf/mcp-server`（不是 plugin） |
| 周期 | 1–7 天 |
| 字段 | npm package name, GitHub URL, description, tools list, env vars |

### 4.9 Smithery

| 项 | 值 |
|---|---|
| 入口 | https://smithery.ai/new |
| 适用对象 | MCP server |
| 周期 | 自动收录后约 1 天审核 |
| 字段 | GitHub URL（需在仓库根加 `smithery.yaml`，见 §4.9.1） |

#### 4.9.1 `smithery.yaml`（仓库根新增）

```yaml
startCommand:
  type: stdio
  configSchema:
    type: object
    required: [KOLMOPDF_API_KEY]
    properties:
      KOLMOPDF_API_KEY:
        type: string
        description: "Your KolmoPDF API key (get one at https://www.kolmopdf.com/api-keys)."
      KOLMOPDF_BASE_URL:
        type: string
        default: "https://www.kolmopdf.com"
  commandFunction: |
    (config) => ({
      command: "npx",
      args: ["-y", "@kolmopdf/mcp-server"],
      env: {
        KOLMOPDF_API_KEY: config.KOLMOPDF_API_KEY,
        KOLMOPDF_BASE_URL: config.KOLMOPDF_BASE_URL || "https://www.kolmopdf.com"
      }
    })
```

### 4.10 lobehub MCP marketplace

| 项 | 值 |
|---|---|
| 入口 | https://lobehub.com/mcp/submit |
| 周期 | 3–7 天 |
| 字段 | name, npm, description, env vars |

### 4.11 Composio（可选）

| 项 | 值 |
|---|---|
| 入口 | https://composio.dev/contact（partnerships） |
| 适用 | 希望走 Composio 的托管 MCP 通道（用户无需自部署） |
| 商业关系 | 涉及分成谈判，v1.0 暂不提交，等用户量起来后评估 |

---

## 5. 提交统一表（自查表）

发布日填写完毕后存档为 `dist-log-<date>.md`。

| 目录 | 状态 | 提交日期 | URL | 备注 |
|---|---|---|---|---|
| Anthropic Community | ☐ | | | |
| Anthropic Verified | ☐ | | | 等运行 30 天后申请 |
| claudemarketplaces.com | ☐ | | | |
| agensi.io | ☐ | | | |
| mcpmarket.com (Skill) | ☐ | | | |
| mcpmarket.com (MCP) | ☐ | | | |
| skillsmp.com | ☐ | | | |
| claudepluginhub.com | ☐ | | | |
| glama.ai | ☐ | | | |
| Smithery | ☐ | | | 需在 repo 加 smithery.yaml |
| lobehub | ☐ | | | |

---

## 6. 发布节奏（推荐时间表）

| Day | 动作 |
|---|---|
| D-7 | M5 完成（CI/CD 试跑），冻结 v1.0 范围 |
| D-3 | M6 完成（三客户端冒烟），准备 release notes |
| D-1 | 内部 dry-run：从全新机器走完整安装流程，记录耗时与坑 |
| **D-day** | 1. 推 git tag `v1.0.0` → 触发 release workflow，发 npm |
| | 2. GitHub Release 公开 |
| | 3. README 加 install snippet |
| | 4. 自有 marketplace 即时可用 |
| D+1 | 提交：claudemarketplaces, skillsmp, glama, Smithery（自动收录类） |
| D+2 | 提交：agensi, mcpmarket（Skill + MCP）, claudepluginhub, lobehub（人工审核类） |
| D+3 | 提交：Anthropic Community（最严格审核，最后提交以让其他目录数据先出现） |
| W+1 | 内部周会：审视各目录收录状态、用户首次安装 funnel |
| W+4 | 申请 Anthropic Verified（积累 30 天稳定记录） |

---

## 7. 持续维护

### 7.1 版本发布流程（每次更新都跑一遍）

```
1. 改代码 → PR review → merge main
2. 改三处 version 号同步：
   - packages/mcp-server/package.json
   - plugins/kolmopdf/.claude-plugin/plugin.json
   - .claude-plugin/marketplace.json (plugin entry version)
3. CHANGELOG.md 添加条目（Keep a Changelog 格式）
4. git tag v<x.y.z> && git push origin v<x.y.z>
5. release workflow 自动发 npm
6. 各 marketplace 自动拉取或重新提交（部分需手动 ping）
```

### 7.2 用户反馈通道

| 通道 | 用途 | 处理 SLA |
|---|---|---|
| GitHub Issues | bug / feature request | 工作日 24h 响应 |
| support@kolmopdf.com | 私密 bug（含 key）、商业咨询 | 24h |
| Discord/X DM | 早期用户问询 | best effort |

### 7.3 用 GitHub Issue 模板收集 bug

`.github/ISSUE_TEMPLATE/bug-report.yml`，必填字段对应 TESTING_AND_USAGE.md §9 的 9 项最小信息。

### 7.4 文档维护

| 文档 | 更新触发条件 |
|---|---|
| DEVELOPMENT.md | API 字段变化 / 工具新增 / 错误码新增 |
| TESTING_AND_USAGE.md | 客户端版本变化 / 安装路径变化 |
| DISTRIBUTION.md | 目录站新增/下线 |
| README.md | 安装命令变化 / 重大功能上线 |

每次 release 同步检查上述文档是否需更新；CI 中加 lint 校验：版本号变化必须伴随 CHANGELOG 改动。
