# KolmoPDF Claude Code Plugin — 开发规范

> **历史设计文档（v1.0），不是当前触发或运行规范。** 下文的内嵌 Skill 示例、旧 API 路径、强制解析与 MCP 要求不得用于覆盖现行实现。当前唯一的 Skill 路由依据是 [SKILL.md](../../plugins/kolmopdf/skills/kolmopdf/SKILL.md)，使用说明见 [README](../../README.md)。
>
> Spec version: 1.0 · 目标客户端: Claude Code · Codex CLI · Cursor (兼容 SKILL.md 的客户端皆可)

## 0. 范围

### In scope (v1.0)

| 能力 | 上游 API |
|---|---|
| PDF → Markdown 解析（含可选翻译） | `POST /api/pdf-to-markdown-proxy/parse` |
| PDF 版式保留翻译 | `POST /api/pdf-to-markdown-proxy/translate-pdf` |
| Markdown → DOCX/HTML/PDF/LaTeX 格式转换 | `POST /api/pdf-to-markdown-proxy/convert` |
| 任务状态查询 | `GET /api/pdf-to-markdown-proxy/status/{task_id}` |
| 结果下载 | `GET /api/pdf-to-markdown-proxy/download/{task_id}` |
| 积分余额查询 | `GET /api/pdf-to-markdown-proxy/balance` |

### Out of scope (v1.0)

Image OCR、Markdown Translation、AI PPT、PDF Merge/Split、首跑赠送积分（依赖后端改动，列入 §13）。

---

## 1. 交付物

| ID | 类型 | 产物 | 分发渠道 |
|---|---|---|---|
| A | npm 包 | `@kolmopdf/mcp-server` | npm registry |
| B | Skill 目录 | `skills/kolmopdf/SKILL.md` (+ supporting refs) | 包含在 Plugin 内 |
| C | Claude Code Plugin | `plugins/kolmopdf/` | GitHub marketplace `komoai2026/claude-plugin` |
| D | Marketplace 入口 | `.claude-plugin/marketplace.json` | GitHub repo root |
| E | Codex CLI 单文件 Skill | 同 B 内容，独立分发路径 `~/.codex/skills/kolmopdf/` | 同 GitHub repo（路径不同） |

---

## 2. 仓库结构

GitHub repo: `komoai2026/claude-plugin`（pnpm workspaces monorepo）。

```
kolmopdf-claude-plugin/
├── .claude-plugin/
│   └── marketplace.json                  # 顶层 marketplace 入口（D）
├── plugins/
│   └── kolmopdf/                         # Claude Code Plugin（C）
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── .mcp.json                     # 引用 npm 上的 MCP server
│       ├── skills/
│       │   └── kolmopdf/
│       │       ├── SKILL.md              # Skill 主文件（B）
│       │       └── references/
│       │           ├── parameter-glossary.md
│       │           └── chain-recipes.md
│       ├── commands/
│       │   ├── parse.md
│       │   ├── translate.md
│       │   ├── convert.md
│       │   └── balance.md
│       └── README.md
├── packages/
│   └── mcp-server/                       # MCP Server (A)
│       ├── src/
│       │   ├── index.ts                  # entry, server bootstrap
│       │   ├── client.ts                 # KolmoPDF API client
│       │   ├── config.ts                 # env-var loader
│       │   ├── errors.ts                 # error mapping
│       │   ├── polling.ts                # task polling state machine
│       │   ├── progress.ts               # MCP progress notification helper
│       │   ├── extract.ts                # ZIP extraction
│       │   ├── pages.ts                  # local page count (pdf-lib)
│       │   └── tools/
│       │       ├── parse-pdf.ts
│       │       ├── translate-pdf.ts
│       │       ├── convert.ts
│       │       ├── estimate-cost.ts
│       │       ├── check-balance.ts
│       │       └── get-task-status.ts
│       ├── tests/
│       │   ├── unit/
│       │   └── integration/
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts
├── codex-skill/                          # Codex CLI 标准路径分发 (E)
│   └── kolmopdf/
│       ├── SKILL.md                      # 软链或镜像自 plugins/.../SKILL.md
│       └── references/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── pnpm-workspace.yaml
├── package.json                          # root, dev deps
├── tsconfig.base.json
├── .gitignore
├── LICENSE                               # MIT
├── README.md
├── DEVELOPMENT.md                        # 本文件
├── TESTING_AND_USAGE.md
└── DISTRIBUTION.md
```

---

## 3. 技术栈与依赖

| 类别 | 选型 | 版本 |
|---|---|---|
| Runtime | Node.js | ≥ 20 LTS |
| 语言 | TypeScript | 5.4+ |
| 包管理 | pnpm | 9.x |
| MCP SDK | `@modelcontextprotocol/sdk` | 1.x（peer dep: zod ≥ 3.25） |
| 校验 | `zod` | 3.25+ |
| 本地 PDF 解析 | `pdf-lib` | 仅用于读取 page count |
| HTTP 客户端 | `undici` | 内置 fetch + multipart 支持 |
| ZIP 解压 | `yauzl` | 7.x |
| 打包 | `tsup` | 8.x（输出 esm + cjs + dts） |
| 测试 | `vitest` | 2.x |
| Lint | `@biomejs/biome` | 1.x |

---

## 4. 环境变量

| 变量 | 必需 | 默认 | 说明 |
|---|---|---|---|
| `KOLMOPDF_API_KEY` | 是 | — | 用户从 https://www.kolmopdf.com/api-keys 申请 |
| `KOLMOPDF_BASE_URL` | 否 | `https://www.kolmopdf.com` | 仅企业/调试场景覆盖 |
| `KOLMOPDF_OUTPUT_DIR` | 否 | `./kolmopdf-output` | 解压目标根目录（相对 cwd） |
| `KOLMOPDF_POLL_INTERVAL_MS` | 否 | `2000` | 状态轮询周期（API 建议 1-3s） |
| `KOLMOPDF_MAX_POLL_MINUTES` | 否 | `30` | 单任务客户端最长等待 |
| `KOLMOPDF_HTTP_TIMEOUT_MS` | 否 | `60000` | 单次 HTTP 调用超时（upload/download 单独放宽） |
| `KOLMOPDF_UPLOAD_TIMEOUT_MS` | 否 | `600000` | 上传超时（300MB 大文件） |

---

## 5. Package A: `@kolmopdf/mcp-server`

### 5.1 package.json 关键字段

```json
{
  "name": "@kolmopdf/mcp-server",
  "version": "1.0.0",
  "description": "MCP server for KolmoPDF — PDF parsing, layout-preserving translation, and Markdown format conversion.",
  "license": "MIT",
  "type": "module",
  "bin": {
    "kolmopdf-mcp": "./dist/index.js"
  },
  "engines": { "node": ">=20" },
  "files": ["dist", "README.md", "LICENSE"],
  "keywords": [
    "mcp", "model-context-protocol", "claude", "claude-code",
    "codex", "pdf", "markdown", "pdf-to-markdown", "translation",
    "kolmopdf"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/komoai2026/claude-plugin.git",
    "directory": "packages/mcp-server"
  }
}
```

### 5.2 Server bootstrap

`src/index.ts` 必须：

1. 通过 `stdio` transport 注册。
2. 启动时不校验 API key（避免无网络场景启动失败）；首次调用任意需鉴权工具时再校验，错误结果以 MCP error 形式返回。
3. 注册下表工具，全部用 `server.registerTool()` 方式。

### 5.3 工具清单

| Tool name | 异步策略 | 暴露给 LLM | 调用对应 API |
|---|---|---|---|
| `kolmopdf_parse_pdf` | 单工具内 submit → poll → download → unzip | 是 | `POST /parse` + status + download |
| `kolmopdf_translate_pdf` | 同上 | 是 | `POST /translate-pdf` + status + download |
| `kolmopdf_convert_markdown` | 同上 | 是 | `POST /convert` + status + download |
| `kolmopdf_estimate_cost` | 仅本地 + 1 次 balance | 是 | 仅 `GET /balance` |
| `kolmopdf_check_balance` | 单次 | 是 | `GET /balance` |
| `kolmopdf_get_task_status` | 单次 | 否（hidden，仅 escape hatch） | `GET /status/{id}` |

> `kolmopdf_get_task_status` 通过 `description` 标注 "advanced/debug" 并避免触发关键词，使 LLM 默认不调用；用户/开发者可显式调用以排障。

### 5.4 Tool: `kolmopdf_parse_pdf`

**Input schema (Zod)**

```ts
z.object({
  file_path: z.string().describe("Absolute or cwd-relative path to a local PDF file."),
  table_mode: z.enum(["markdown", "image"]).optional(),
  formula_format: z.enum(["dollar", "bracket"]).optional(),
  enable_translation: z.boolean().optional(),
  target_language: z.enum(["zh","en","ja","ko","fr","de","es","ru"]).optional(),
  output_options: z.array(z.enum(["original","translated","bilingual"])).optional(),
  images_as_url: z.boolean().optional(),
  skip_rotation_detection: z.boolean().optional(),
  enable_cross_page_merge: z.boolean().optional(),
  output_subdir: z.string().optional()
    .describe("Subdirectory name under KOLMOPDF_OUTPUT_DIR. Defaults to <task_id>.")
})
```

**Boolean → string 转换**：API 端使用 `"true"` / `"false"` 字符串形式接收，client 层负责转换。

**FormData 构造**

```
file        : <binary>
table_mode  : "markdown" | "image"
formula_format : "dollar" | "bracket"
enable_translation : "true" | "false"
target_language : <code>     # 仅当 enable_translation=true
output_options  : "original,translated"  # 逗号分隔
images_as_url   : "true" | "false"
skip_rotation_detection : "true" | "false"
enable_cross_page_merge : "true" | "false"
```

**返回结构**

```ts
{
  task_id: string,
  pages_parsed: number,                      // 从 points_deducted 倒推：parse_only=pts/2, parse+translate=pts/3
  points_deducted: number,
  remaining_points: number,
  output: {
    type: "zip_extracted" | "markdown_file",
    markdown_path: string,                   // 已解压后的 .md 绝对路径
    images_dir: string | null,               // zip 模式下为 images/ 路径；url 模式下为 null
    output_root: string                      // 总输出目录绝对路径
  },
  preview: string                            // markdown 前 500 字符
}
```

**行为细则**

1. 上传前本地用 `pdf-lib` 读 page count；若 > 800 → 立即抛 `parse_page_limit_exceeded` 错误（带建议拆分到 800 页以内）。
2. 上传前 `fs.stat` 校验 file size > 300MB → 立即抛 `parse_file_too_large`。
3. 上传响应解析 `task_id` 后进入 polling（§5.10）。
4. 状态 `completed` 后调用 `/download/{task_id}` 流式拉取。
5. `images_as_url=false`（默认） → 拉到 ZIP，解压到 `<OUTPUT_DIR>/<task_id>/`，自动识别第一个 `*.md` 作为 `markdown_path`；其余文件平铺。
6. `images_as_url=true` → 拉到 markdown 文件，直接写入 `<OUTPUT_DIR>/<task_id>/result.md`，`images_dir=null`。
7. 全程 progress notification（§5.11）。

### 5.5 Tool: `kolmopdf_translate_pdf`

**Input schema**

```ts
z.object({
  file_path: z.string(),
  source_language: z.string().optional().default("en"),
  target_language: z.string().optional().default("zh"),
  layout_modes: z.array(z.enum(["translated_only","side_by_side"]))
    .optional().default(["translated_only"]),
  enable_image_translation: z.boolean().optional().default(false),
  enable_table_translation: z.boolean().optional().default(false),
  output_subdir: z.string().optional()
})
```

**FormData 字段**：`file`, `sourceLanguage`, `targetLanguage`, `layoutModes`（逗号分隔），`enableImageTranslation`, `enableTableTranslation`（boolean → 字符串）。

**返回结构**

```ts
{
  task_id: string,
  pages_translated: number,                  // 倒推：points_deducted / 2
  points_deducted: number,
  remaining_points: number,
  output: {
    translated_pdf_path: string              // 下载后落到 <OUTPUT_DIR>/<task_id>/translated.pdf
  }
}
```

**行为细则**：同 §5.4 的 1–4；下载文件保存为 `.pdf`，无解压；progress 同 §5.11。

### 5.6 Tool: `kolmopdf_convert_markdown`

**Input schema**

```ts
z.object({
  file_path: z.string()
    .describe("Path to a .md/.markdown file or .zip containing markdown + images."),
  target_format: z.enum(["word","docx","html","pdf","latex","tex"])
    .optional().default("word"),
  output_subdir: z.string().optional()
})
```

**FormData 字段**：`file`, `targetFormat`。

**返回结构**

```ts
{
  task_id: string,
  points_deducted: number,
  remaining_points: number,
  output: {
    output_path: string,                     // 落到 <OUTPUT_DIR>/<task_id>/result.<ext>
    target_format: string                    // 规范化后的 docx/html/pdf/tex
  }
}
```

**扩展名映射**：`word|docx → .docx`, `html → .html`, `pdf → .pdf`, `latex|tex → .tex`。

### 5.7 Tool: `kolmopdf_estimate_cost`

**Input schema**

```ts
z.object({
  file_path: z.string(),
  operation: z.enum(["parse","parse_translate","translate","convert"]),
  options: z.object({
    images_as_url: z.boolean().optional()
  }).optional()
})
```

**计算规则**

| operation | 公式 |
|---|---|
| `parse` | `pages × 2` |
| `parse_translate` | `pages × 3` |
| `translate` | `pages × 2` |
| `convert` | `1` |

**返回结构**

```ts
{
  pages: number | null,                      // convert 时为 null
  estimated_credits: number,
  current_balance: number,                   // 调用 GET /balance
  sufficient: boolean,
  shortfall: number,                         // = max(0, estimated_credits - current_balance)
  recommendation: string                     // 例如 "Sufficient" / "Need top-up at https://www.kolmopdf.com/subscription"
}
```

**行为**：本地 `pdf-lib` 读页数 + 1 次 `/balance`。不消耗积分。convert 时跳过页数读取，固定 1 积分。

### 5.8 Tool: `kolmopdf_check_balance`

Input：空。Output：`{ points: number, api_key_masked: string }`（API key 显示前 6 + 后 4，中间 `***`）。

### 5.9 Tool: `kolmopdf_get_task_status`

Input：`{ task_id: string }`。Output：原样透传 API 响应。

**Description 写法**（避免误触发）：
```
Advanced/debug tool. Returns raw status for a KolmoPDF task. Use only when explicitly asked to inspect a task by ID, or when troubleshooting a stuck task.
```

### 5.10 Polling 状态机

```
INIT
  └─ POST /parse (or /translate-pdf / /convert)
       ├─ HTTP 4xx/5xx → ERROR (map to KolmoPDF error_code, see §8)
       └─ 200 { task_id, status }
            ├─ status = "processing" → POLLING
            ├─ status = "waiting"    → POLLING
            └─ (other)               → POLLING

POLLING:
  loop every KOLMOPDF_POLL_INTERVAL_MS:
    GET /status/{task_id}
      ├─ status in {pending, waiting, processing} → emit progress, continue
      ├─ status = "completed" → DOWNLOAD
      └─ status = "failed"    → ERROR (use error_code from response; note: server-side auto-refunds)
  guard: if elapsed > KOLMOPDF_MAX_POLL_MINUTES → ERROR("client_polling_timeout")

DOWNLOAD:
  GET /download/{task_id}  (Accept any binary)
    ├─ HTTP 200 → write to disk, extract if zip, return result
    └─ HTTP error → ERROR("download_failed")
```

**重试策略**

| 场景 | 行为 |
|---|---|
| HTTP 网络错误（ECONNRESET / ETIMEDOUT / 5xx） | 指数退避，最多 3 次（base 1s，因子 2） |
| HTTP 4xx（业务错误） | 立即 fail，不重试 |
| `parse_error` / `parse_timeout` / `parse_file_invalid` | 立即 fail（API 已扣后退） |
| Polling 接口偶发 5xx | 同网络错误重试 |

### 5.11 Progress notification

每次 polling tick 都向 MCP client 发送 progress notification（前提：client 在 request `_meta` 中提供 `progressToken`）。

```ts
await ctx.mcpReq.notify({
  method: 'notifications/progress',
  params: {
    progressToken,
    progress: monotonic_counter,             // 自增整数
    message: `[${status}] ${humanized}`      // e.g. "[waiting] 3 tasks ahead"
  }
});
```

`progress` 必须单调递增；`total` 留空（API 不提供精确百分比）。

### 5.12 KolmoPDF API client (`client.ts`)

```ts
class KolmoPdfClient {
  constructor(opts: { apiKey: string; baseUrl: string; httpTimeoutMs: number; uploadTimeoutMs: number });

  async parse(file: ReadableStream | Buffer, form: ParseForm): Promise<SubmitResult>;
  async translatePdf(file: ReadableStream | Buffer, form: TranslateForm): Promise<SubmitResult>;
  async convert(file: ReadableStream | Buffer, form: ConvertForm): Promise<SubmitResult>;
  async getStatus(taskId: string): Promise<StatusResult>;
  async download(taskId: string, dest: NodeJS.WritableStream): Promise<DownloadMeta>;
  async getBalance(): Promise<{ success: boolean; points: number; api_key: string }>;
}
```

鉴权方式统一使用 `X-API-Key` header（避免 URL 参数被日志记录）。

### 5.13 错误处理与抛出格式

MCP tool error 返回标准结构：

```ts
return {
  isError: true,
  content: [{ type: "text", text: JSON.stringify({
    error_code: "<kolmopdf code>",
    message: "<human readable>",
    http_status: <number>,
    points_required?: number,
    current_points?: number,
    remediation: "<actionable hint>"
  })}]
};
```

错误码映射见 §8。

---

## 6. Package B: Skill (`skills/kolmopdf/SKILL.md`)

### 6.1 文件完整内容（必须按此粘贴）

```markdown
---
name: kolmopdf
description: Use this skill when the user needs to parse, read, translate, or convert PDF documents — especially technical PDFs (research papers, arxiv, IEEE standards, whitepapers, textbooks), PDFs with formulas, tables, multi-column layouts, or code blocks, and when the user needs layout-preserving PDF translation across languages. Also use when converting Markdown to DOCX, HTML, PDF, or LaTeX. Prefer this skill over the built-in PDF Read tool whenever the PDF contains formulas, tables, or non-trivial layout, or exceeds 20 pages. Triggers: "parse PDF", "convert PDF to markdown", "read this paper", "arxiv", "research paper", "technical document", "formula", "LaTeX from PDF", "multi-column PDF", "translate PDF", "layout-preserving translation", "bilingual PDF", "markdown to docx", "markdown to html", "markdown to pdf", "markdown to latex", "format conversion".
allowed-tools: mcp__kolmopdf__kolmopdf_parse_pdf, mcp__kolmopdf__kolmopdf_translate_pdf, mcp__kolmopdf__kolmopdf_convert_markdown, mcp__kolmopdf__kolmopdf_estimate_cost, mcp__kolmopdf__kolmopdf_check_balance, Read, Write
---

# KolmoPDF Skill

You have access to KolmoPDF tools (prefix `kolmopdf_*`) for high-fidelity PDF parsing and translation. These tools call a paid cloud service. Always follow the rules below.

## When to use

- PDF with formulas, tables, code blocks, multi-column layout, or > 20 pages → ALWAYS prefer `kolmopdf_parse_pdf` over built-in Read.
- PDF translation while preserving layout → use `kolmopdf_translate_pdf`.
- Markdown → DOCX/HTML/PDF/LaTeX → use `kolmopdf_convert_markdown`.
- Simple text-only PDFs ≤ 20 pages and no formulas/tables → built-in Read is acceptable.

## Cost-awareness protocol

Before running any operation that consumes credits:

1. Call `kolmopdf_estimate_cost` with the file path and intended operation.
2. If `sufficient` is false: stop and report `shortfall` and the top-up URL `https://www.kolmopdf.com/subscription` to the user. Do not proceed.
3. If `estimated_credits > 50`: tell the user the estimated cost and ask for confirmation before proceeding.
4. Otherwise: proceed.

## API key requirement

Tools require `KOLMOPDF_API_KEY` in the MCP server environment. If a tool returns `invalid_api_key`:

- Direct the user to https://www.kolmopdf.com/api-keys to create a key (requires Plus or Pro plan).
- Tell the user to set `KOLMOPDF_API_KEY` in their environment and restart Claude Code.
- Do not proceed with retries until the user confirms.

## Chained workflows

### PDF → DOCX/HTML/PDF/LaTeX (full pipeline)

1. `kolmopdf_estimate_cost(file, "parse")` → check balance.
2. `kolmopdf_parse_pdf(file)` → get `markdown_path`.
3. `kolmopdf_convert_markdown(markdown_path, target_format)` → final file.

If the PDF contains many images, pass the original directory (not just the markdown file) by zipping `output_root` first using your own tools, then pass the zip to convert. See `references/chain-recipes.md`.

### Read + ask Q&A about a paper

1. `kolmopdf_parse_pdf(file)` → get `markdown_path` and `preview`.
2. Use `Read` on `markdown_path` to load the full content.
3. Answer the user's question grounded in the markdown.

### Translate then convert to bilingual deliverable

Option A (PDF deliverable):
- `kolmopdf_translate_pdf(file, layout_modes=["side_by_side"])` → single PDF with side-by-side layout.

Option B (editable Markdown deliverable):
- `kolmopdf_parse_pdf(file, enable_translation=true, output_options=["bilingual"])` → bilingual markdown.

## Parameter guidance

See `references/parameter-glossary.md` for the full parameter table and defaults. Highlights:

- `formula_format=dollar` is the default and works with KaTeX/MathJax. Use `bracket` for LaTeX-strict downstream renderers.
- `enable_cross_page_merge=true` is recommended when the source PDF has tables spanning page breaks.
- `images_as_url=true` returns a single markdown file with 30-day URL references; use this for ephemeral pipelines. Default `false` returns a self-contained ZIP.

## Output handling

After successful tool calls, treat `output.markdown_path` / `output.translated_pdf_path` / `output.output_path` as the canonical local file paths and reference them in your reply to the user. Show the user the absolute path; do not re-print the entire file unless asked.

## Failure modes

| error_code | Action |
| --- | --- |
| `invalid_api_key` | Stop; follow API key requirement section above. |
| `insufficient_points` | Stop; report shortfall and top-up URL. |
| `parse_page_limit_exceeded`, `parse_file_too_large` | Stop; suggest splitting the PDF locally. |
| `parse_file_not_pdf`, `parse_file_invalid` | Stop; ask the user to re-export the PDF. |
| `parse_error`, `parse_timeout` | Server auto-refunds points. Suggest retry with smaller page range. |
| `client_polling_timeout` | Tell the user the task is still running server-side and suggest using `kolmopdf_get_task_status` with the task_id later. |
| Network/5xx | Tools auto-retry up to 3 times. If still failing, suggest checking https://www.kolmopdf.com/contact. |
```

### 6.2 references/parameter-glossary.md

完整参数对照表（API 文档原样转写为表格）。该文件不会被自动加载，仅在 SKILL 内显式 `Read` 时使用。包含：

- `kolmopdf_parse_pdf` 全部字段、合法值、默认值、计费影响
- `kolmopdf_translate_pdf` 全部字段
- `kolmopdf_convert_markdown` 全部字段
- 语言代码完整列表
- ZIP 输出结构示意

### 6.3 references/chain-recipes.md

记录三类典型链式调用的精确步骤（与 §6.1 中的简版对应展开）。

### 6.4 Skill 触发关键词清单（用于 description）

| 类别 | 关键词 |
|---|---|
| 通用 PDF | `PDF`, `parse PDF`, `read PDF`, `extract from PDF`, `convert PDF to markdown` |
| 学术 | `arxiv`, `arxiv paper`, `research paper`, `IEEE`, `academic paper`, `read this paper`, `summarize paper` |
| 技术文档 | `technical document`, `whitepaper`, `standard document`, `RFC`, `API doc PDF`, `datasheet` |
| 内容特征 | `formula`, `equation`, `LaTeX from PDF`, `table from PDF`, `multi-column PDF`, `code block in PDF` |
| 翻译 | `translate PDF`, `layout-preserving translation`, `bilingual PDF`, `side-by-side translation` |
| 格式转换 | `markdown to docx`, `markdown to word`, `markdown to html`, `markdown to pdf`, `markdown to latex`, `format conversion` |

---

## 7. Package C: Claude Code Plugin

### 7.1 `plugins/kolmopdf/.claude-plugin/plugin.json`

```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin.json",
  "name": "kolmopdf",
  "displayName": "KolmoPDF",
  "description": "High-fidelity PDF to Markdown parsing, layout-preserving PDF translation, and Markdown→DOCX/HTML/PDF/LaTeX conversion. Handles formulas, tables, and multi-column layouts that the built-in Read tool struggles with.",
  "version": "1.0.0",
  "author": {
    "name": "KomoAI LLC",
    "email": "support@kolmopdf.com"
  },
  "homepage": "https://www.kolmopdf.com",
  "repository": "https://github.com/komoai2026/claude-plugin",
  "license": "MIT",
  "keywords": [
    "pdf", "markdown", "ocr", "translation", "latex",
    "research", "arxiv", "kolmopdf"
  ],
  "category": "document-processing"
}
```

### 7.2 `plugins/kolmopdf/.mcp.json`

```json
{
  "mcpServers": {
    "kolmopdf": {
      "command": "npx",
      "args": ["-y", "@kolmopdf/mcp-server"],
      "env": {
        "KOLMOPDF_API_KEY": "${KOLMOPDF_API_KEY}"
      }
    }
  }
}
```

> 注：`env` 中的 `${KOLMOPDF_API_KEY}` 走 Claude Code 的环境变量替换；用户在 shell rc 或 `.env` 设置即可。

### 7.3 Slash commands

四个命令文件，全部位于 `plugins/kolmopdf/commands/`。

#### 7.3.1 `commands/parse.md`

```markdown
---
description: Parse a PDF to Markdown via KolmoPDF (handles formulas, tables, multi-column).
argument-hint: <file-path> [--translate] [--target-lang zh|en|ja|ko|fr|de|es|ru]
allowed-tools: mcp__kolmopdf__kolmopdf_parse_pdf, mcp__kolmopdf__kolmopdf_estimate_cost
---

Parse the PDF at the provided path using KolmoPDF. Steps:

1. Run `kolmopdf_estimate_cost` for operation `parse` (or `parse_translate` if `--translate` was passed) and report the cost. If `sufficient=false`, stop.
2. If `--translate` was passed, set `enable_translation=true` and use the `--target-lang` value (default `zh`) with `output_options=["bilingual"]`.
3. Call `kolmopdf_parse_pdf`.
4. Report `output.markdown_path` and `preview` to the user.

Arguments: $ARGUMENTS
```

#### 7.3.2 `commands/translate.md`

```markdown
---
description: Translate a PDF while preserving its original layout (KolmoPDF).
argument-hint: <file-path> [--from <lang>] [--to <lang>] [--mode translated_only|side_by_side]
allowed-tools: mcp__kolmopdf__kolmopdf_translate_pdf, mcp__kolmopdf__kolmopdf_estimate_cost
---

Translate the PDF while preserving its layout. Steps:

1. Parse the file path and flags from $ARGUMENTS. Defaults: `--from en`, `--to zh`, `--mode translated_only`.
2. Call `kolmopdf_estimate_cost` for operation `translate`. Stop if insufficient.
3. Call `kolmopdf_translate_pdf` with the parsed arguments.
4. Report `output.translated_pdf_path` to the user.

Arguments: $ARGUMENTS
```

#### 7.3.3 `commands/convert.md`

```markdown
---
description: Convert Markdown to DOCX, HTML, PDF, or LaTeX (KolmoPDF).
argument-hint: <markdown-or-zip-path> [--format word|docx|html|pdf|latex|tex]
allowed-tools: mcp__kolmopdf__kolmopdf_convert_markdown, mcp__kolmopdf__kolmopdf_estimate_cost
---

Convert the provided Markdown file (or ZIP archive containing markdown + images) to the target format. Steps:

1. Parse arguments. Default `--format word`.
2. Call `kolmopdf_estimate_cost` for operation `convert` (always 1 credit). Stop if insufficient.
3. Call `kolmopdf_convert_markdown`.
4. Report `output.output_path` to the user.

Arguments: $ARGUMENTS
```

#### 7.3.4 `commands/balance.md`

```markdown
---
description: Show KolmoPDF account credit balance.
allowed-tools: mcp__kolmopdf__kolmopdf_check_balance
---

Call `kolmopdf_check_balance` and report the result in a single line: `KolmoPDF balance: <points> credits (key <masked>)`.
```

### 7.4 命名空间

Plugin 内 skill 调用形式：`/kolmopdf:kolmopdf`（slash menu 直接显示 KolmoPDF）。
Plugin 内 command 调用形式：`/kolmopdf:parse`, `/kolmopdf:translate`, `/kolmopdf:convert`, `/kolmopdf:balance`。

### 7.5 Plugin README

`plugins/kolmopdf/README.md` 仅包含：

- 一段安装命令矩阵（Claude Code / Codex CLI / Cursor / Claude Desktop）
- API key 申请链接
- 工具能力清单表
- License: MIT

不写教程性文字。

---

## 8. 统一错误码映射表

> source 列：API 上游已定义的错误码 / client 表示由 MCP server 本地补充

| error_code | source | HTTP | 是否扣分 | MCP 抛出 message | 建议 remediation |
|---|---|---|---|---|---|
| `invalid_api_key` | API | 401 | 否 | "API key is missing or invalid." | "Create a key at https://www.kolmopdf.com/api-keys (requires Plus/Pro)." |
| `insufficient_points` | API | 402 | 否 | "Not enough credits." | "Top up at https://www.kolmopdf.com/subscription." |
| `points_deduction_failed` | API | 402 | 否 | "Credit deduction failed." | "Retry; if persists contact support." |
| `no_file_found` | API | 400 | 否 | "Request missing file field." | "(internal) MCP server bug, please report." |
| `parse_file_too_large` | API | 400 | 否 | "PDF exceeds 300MB." | "Split the PDF locally." |
| `parse_page_limit_exceeded` | API | 400 | 否 | "PDF exceeds 800 pages." | "Split the PDF locally." |
| `parse_file_not_pdf` | API | 400 | 否 | "File is not a valid PDF." | "Upload a .pdf file." |
| `translate_pdf_file_too_large` | API | 400 | 否 | (同上 translate) | 同 |
| `translate_pdf_file_not_pdf` | API | 400 | 否 | 同 | 同 |
| `translate_pdf_page_limit_exceeded` | API | 400 | 否 | 同 | 同 |
| `convert_file_too_large` | API | 400 | 否 | "File exceeds 300MB." | "Reduce file size." |
| `convert_file_type_unsupported` | API | 400 | 否 | "File must be .md / .markdown / .zip." | "Convert source to markdown first." |
| `convert_target_format_unsupported` | API | 400 | 否 | "Target format unsupported." | "Use word/docx/html/pdf/latex/tex." |
| `file_upload_failed` | API | 500 | 否 | "Upload to storage failed." | "Check network and retry." |
| `task_creation_failed` | API | 500 | 是（自动退） | "Task creation failed." | "Retry." |
| `parse_error` | API | 500 | 是（自动退） | "Parsing failed." | "Retry; if persists, split and try again." |
| `parse_file_invalid` | API | 500 | 是（自动退） | "PDF is malformed." | "Re-export the PDF." |
| `parse_timeout` | API | 500 | 是（自动退） | "Server-side timeout." | "Split into smaller PDFs." |
| `api_task_error` | API | 500 | 视情况 | "Generic task error." | "Retry; if persists contact support." |
| `client_polling_timeout` | client | — | 否 | "Local polling exceeded KOLMOPDF_MAX_POLL_MINUTES." | "Task may still be running. Use kolmopdf_get_task_status with task_id." |
| `client_network_error` | client | — | 否 | "Network error after retries." | "Check network." |
| `client_local_validation` | client | — | 否 | "Local pre-check failed (page count / file size)." | (按子类型) |
| `client_extract_failed` | client | — | 否 | "ZIP extraction failed." | "Check disk permissions on output dir." |

---

## 9. Marketplace 入口

### 9.1 `.claude-plugin/marketplace.json`（仓库根目录）

```json
{
  "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
  "name": "kolmopdf",
  "description": "Official KolmoPDF plugin marketplace for Claude Code.",
  "owner": {
    "name": "KomoAI LLC",
    "email": "support@kolmopdf.com"
  },
  "plugins": [
    {
      "name": "kolmopdf",
      "displayName": "KolmoPDF",
      "source": "./plugins/kolmopdf",
      "description": "High-fidelity PDF to Markdown parsing, layout-preserving PDF translation, and Markdown format conversion.",
      "version": "1.0.0",
      "author": { "name": "KomoAI LLC", "email": "support@kolmopdf.com" },
      "homepage": "https://www.kolmopdf.com",
      "repository": "https://github.com/komoai2026/claude-plugin",
      "license": "MIT",
      "keywords": ["pdf", "markdown", "ocr", "translation", "latex", "research"],
      "category": "document-processing",
      "tags": ["pdf", "markdown", "translation", "academic", "arxiv"]
    }
  ]
}
```

> 不要把这个 marketplace 取名为 Anthropic 保留名（参见 §11 reserved list）。当前 `kolmopdf` 通过。

### 9.2 安装命令（最终用户视角）

```bash
# Claude Code
/plugin marketplace add komoai2026/claude-plugin
/plugin install kolmopdf@kolmopdf

# 环境变量（用户自己设置）
export KOLMOPDF_API_KEY=sk-xxxxxxxxxxxxxxxx
```

---

## 10. Codex CLI 兼容路径

### 10.1 镜像同一份 SKILL.md

CI 中将 `plugins/kolmopdf/skills/kolmopdf/` 整体复制到 `codex-skill/kolmopdf/`。两份内容必须 byte-identical；release pipeline 用脚本校验。

### 10.2 用户安装方式（README 指引，不依赖 Codex 的 plugin 体系）

```bash
# Codex CLI（不走 plugin，直接放 skill 目录）
mkdir -p ~/.codex/skills
git clone --depth 1 https://github.com/komoai2026/claude-plugin /tmp/kolmopdf
cp -r /tmp/kolmopdf/codex-skill/kolmopdf ~/.codex/skills/

# MCP server 通过 ~/.codex/config.toml 或 Codex 推荐方式独立配置：
# [mcp_servers.kolmopdf]
# command = "npx"
# args = ["-y", "@kolmopdf/mcp-server"]
# env = { KOLMOPDF_API_KEY = "sk-..." }
```

> Codex 不支持 `.mcp.json` plugin 嵌入，所以 MCP server 配置需用户手动加。SKILL.md 中的 `allowed-tools` 字段在 Codex 中被忽略（OpenAI 文档明确说明），不构成功能阻塞。

---

## 11. 包发布规范

### 11.1 npm 包

| 字段 | 值 |
|---|---|
| Package name | `@kolmopdf/mcp-server` |
| Scope | `@kolmopdf`（需注册组织） |
| Access | `public` |
| Distribution tag | `latest` |
| Engines | `node >= 20` |
| Files included | `dist/`, `README.md`, `LICENSE` |
| Published via | GitHub Actions release workflow（§12.2） |

### 11.2 Marketplace 保留名规避

不可用 marketplace 名（节选 Anthropic 官方保留）：
`claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`, `anthropic-marketplace`, `anthropic-plugins`, `agent-skills`, `anthropic-agent-skills`, `knowledge-work-plugins`, `life-sciences`, 任何 `official-*` / `anthropic-*` 前缀。

本项目使用：`kolmopdf` ✅

---

## 12. CI/CD

### 12.1 `.github/workflows/ci.yml`

| Job | 触发 | 步骤 |
|---|---|---|
| `lint` | push / PR | `pnpm install` → `pnpm biome check .` |
| `typecheck` | push / PR | `pnpm -r tsc --noEmit` |
| `test:unit` | push / PR | `pnpm -r test:unit` |
| `test:integration` | nightly + manual | 用 secret `KOLMOPDF_API_KEY` 跑一组 smoke test（§见 TESTING_AND_USAGE.md） |
| `validate-plugin` | push / PR | `npx @anthropic-ai/claude-code plugin validate .`（cli 提供时启用） |
| `mirror-codex-skill` | push (main) | 脚本校验 `plugins/.../SKILL.md` 与 `codex-skill/.../SKILL.md` 一致 |

### 12.2 `.github/workflows/release.yml`

触发：push tag `v*.*.*`

| Step | 行为 |
|---|---|
| build | `pnpm -r build`（产出 `dist/`） |
| publish-npm | `cd packages/mcp-server && pnpm publish --access public --no-git-checks` |
| bump-plugin-version | 自动校验 `plugins/kolmopdf/.claude-plugin/plugin.json` 与 tag 匹配，不匹配则 fail |
| github-release | 用 conventional-changelog 生成 release notes |

### 12.3 版本策略

| 包/文件 | 版本号 | 策略 |
|---|---|---|
| `@kolmopdf/mcp-server` | 独立 semver | 主导版本，按 SDK 变化 |
| `plugin.json` `version` | 跟随 mcp-server | 同步发版 |
| `marketplace.json` plugin entry `version` | 跟随 plugin.json | 同步发版 |
| Git tag | `v<semver>` | 单调递增 |

> 每次发版必须同时改三处 version，否则 Claude Code 客户端不会拉取更新（旧版本 cache hit）。release workflow 中加 sanity check。

---

## 13. 后续增量计划（v1.1+，需后端配合）

| 计划项 | 后端依赖 | 客户端改动 |
|---|---|---|
| Skill 首次安装赠送积分（兑换码） | 后端新增「插件专属兑换码池」+ 防滥用（限制每账户一次） | MCP server 安装后首次启动检测到 0 积分时弹一次性 onboarding 文案，引导兑换 |
| 异步任务取消 | 后端 `DELETE /status/{task_id}` | MCP 增加 `kolmopdf_cancel_task` |
| 任务失败精确 error_code（如细分 `parse_table_failed`） | 后端枚举扩充 | 错误码映射表更新 |
| Image OCR 接口开放 | 后端 API 已存在，仅需 API key 鉴权 | 新工具 `kolmopdf_parse_image` |
| Markdown Translation 接口 | 同上 | 新工具 `kolmopdf_translate_markdown` |
| 任务事件 webhook（替代 polling） | 后端新增 webhook | MCP 可选订阅替代 polling |

---

## 14. 开发顺序（建议里程碑）

| 阶段 | 产出 | 验收 |
|---|---|---|
| M1 | `client.ts` + `errors.ts` + `polling.ts` 单元测试 | 全部 KolmoPDF API 路径单测覆盖 ≥ 80% |
| M2 | 三个核心 tool（parse/translate/convert） | 本地 stdio MCP server 能跑通三类任务 |
| M3 | 辅助 tool（estimate_cost / check_balance / get_task_status） | Skill 中的 cost-aware 流程跑通 |
| M4 | Plugin manifest + SKILL.md + slash commands + marketplace.json | `claude plugin validate .` 全绿 |
| M5 | CI/CD + npm 发版试跑 | dry-run release 通过 |
| M6 | Codex CLI 镜像 + 三客户端冒烟（见 TESTING_AND_USAGE.md） | 三客户端冒烟全过 |
| M7 | 正式 release | 见 DISTRIBUTION.md 时间表 |
