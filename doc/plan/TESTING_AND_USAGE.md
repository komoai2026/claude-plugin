# KolmoPDF Claude Plugin — 测试与使用文档

> 本文件供发布后用户安装、内部团队 QA、和 CI smoke test 共用。
> 所有命令以 macOS / Linux 为基准；Windows 用户改用 PowerShell 等价命令。

## 1. 前置条件

| 项 | 要求 |
|---|---|
| Node.js | ≥ 20 LTS |
| KolmoPDF 账户 | Plus 或 Pro 套餐（Free / Go 用户无 API 权限） |
| API Key | 已在 https://www.kolmopdf.com/api-keys 创建 |
| 积分 | 测试用 ≥ 200（足够跑完整套用例） |
| 网络 | 可访问 `https://www.kolmopdf.com` |

环境变量设置：

```bash
export KOLMOPDF_API_KEY=sk-xxxxxxxxxxxxxxxx
```

---

## 2. 安装命令矩阵

### 2.1 Claude Code

```bash
# 1. 添加 marketplace
/plugin marketplace add kolmopdf/claude-plugin

# 2. 安装 plugin
/plugin install kolmopdf@kolmopdf

# 3. 重启 Claude Code（首次安装时拉取 npm 包）
```

非交互安装（脚本场景）：

```bash
claude plugin marketplace add kolmopdf/claude-plugin
claude plugin install kolmopdf@kolmopdf
```

### 2.2 Codex CLI

```bash
# 1. 克隆 skill 到 Codex 标准路径
mkdir -p ~/.codex/skills
git clone --depth 1 https://github.com/komoai2026/claude-plugin /tmp/kolmopdf
cp -r /tmp/kolmopdf/codex-skill/kolmopdf ~/.codex/skills/

# 2. 注册 MCP server（Codex 不自动读取 plugin .mcp.json）
# 编辑 ~/.codex/config.toml，追加：
```

```toml
[mcp_servers.kolmopdf]
command = "npx"
args = ["-y", "@kolmopdf/mcp-server"]
env = { KOLMOPDF_API_KEY = "sk-..." }
```

```bash
# 3. 重启 Codex
```

### 2.3 Cursor

```bash
# 1. 安装 skill 到 Cursor 用户 skill 路径
mkdir -p ~/.cursor/skills
cp -r /tmp/kolmopdf/codex-skill/kolmopdf ~/.cursor/skills/

# 2. MCP server 注册：编辑 ~/.cursor/mcp.json
```

```json
{
  "mcpServers": {
    "kolmopdf": {
      "command": "npx",
      "args": ["-y", "@kolmopdf/mcp-server"],
      "env": { "KOLMOPDF_API_KEY": "sk-..." }
    }
  }
}
```

### 2.4 Claude Desktop（手动添加 MCP server）

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS）或 `%APPDATA%\Claude\claude_desktop_config.json`（Windows）：

```json
{
  "mcpServers": {
    "kolmopdf": {
      "command": "npx",
      "args": ["-y", "@kolmopdf/mcp-server"],
      "env": { "KOLMOPDF_API_KEY": "sk-..." }
    }
  }
}
```

> Claude Desktop 不支持 SKILL.md，因此仅获得 MCP 工具能力，无自动触发。

---

## 3. 安装后验证 Checklist

| # | 步骤 | 期望 |
|---|---|---|
| 1 | 启动客户端后输入 `/help`（Claude Code）或 `/skills`（Codex） | 看到 `kolmopdf` skill 列出 |
| 2 | 输入 `/kolmopdf:balance` | 输出格式：`KolmoPDF balance: <number> credits (key sk-xxxxxx...xxxx)` |
| 3 | 自然语言询问 "what tools do you have for parsing PDFs?" | Agent 应主动提及 KolmoPDF |
| 4 | 故意把 `KOLMOPDF_API_KEY` 改成空值后重启 | 调用任何工具应返回 `invalid_api_key` 并提示去 `/api-keys` |

---

## 4. 功能测试用例

> 准备 5 个真实 PDF 作为 fixtures，存放于 `tests/fixtures/`（不入库，列在 README 中由测试者各自下载）。

### 4.1 测试 fixture 清单

| 文件 | 类型 | 页数 | 关键特征 |
|---|---|---|---|
| `attention-is-all-you-need.pdf` | arxiv 论文 | 15 | 公式密集、多栏、图表 |
| `ieee-spec-sample.pdf` | IEEE 技术标准 | 40 | 跨页表格、嵌套小节 |
| `bilingual-jp-source.pdf` | 日文技术文档 | 8 | 翻译用例 |
| `large-handbook.pdf` | 大型 PDF | 500 | 边界压力测试 |
| `oversized-1gb.pdf` | 文件 > 300MB | — | 文件大小错误用例 |

### 4.2 用例 T1: 基础 parse

**Prompt**: "请帮我把 attention-is-all-you-need.pdf 转成 markdown。"

| 检查项 | 期望 |
|---|---|
| Agent 是否调用 `kolmopdf_estimate_cost` | ✅ 应在 parse 前调用 |
| Agent 是否调用 `kolmopdf_parse_pdf` | ✅ |
| 返回的 `markdown_path` 是否存在 | ✅ 本地文件可读 |
| Markdown 中公式数量 | ≥ 80% 的可见公式被 `$...$` / `$$...$$` 包裹 |
| 表格 | 至少 1 个表格成功转为 markdown 表格 |
| 多栏阅读顺序 | 段落顺序与原文一致，不串行 |
| 积分扣除 | `points_deducted = pages × 2` |

### 4.3 用例 T2: parse + 翻译（中英双语）

**Prompt**: "Parse this paper into bilingual markdown for me."（指向 `attention-is-all-you-need.pdf`）

| 检查项 | 期望 |
|---|---|
| `enable_translation=true` | ✅ |
| `output_options` 包含 `bilingual` 或 agent 主动设置 | ✅ |
| 输出 markdown 含中英对照 | ✅ |
| `points_deducted = pages × 3` | ✅ |

### 4.4 用例 T3: 版式保留翻译

**Prompt**: "把 bilingual-jp-source.pdf 翻译成英文，保留原版式。"

| 检查项 | 期望 |
|---|---|
| Agent 调用 `kolmopdf_translate_pdf`（非 parse） | ✅ |
| `source_language=ja`, `target_language=en` | ✅ |
| 返回的 PDF 文件可正常打开 | ✅ |
| PDF 中文字已替换为英文，图表位置保持 | ✅ |
| `points_deducted = pages × 2` | ✅ |

### 4.5 用例 T4: 跨页表格合并

**Prompt**: "Parse ieee-spec-sample.pdf. Make sure tables that span pages are merged."

| 检查项 | 期望 |
|---|---|
| `enable_cross_page_merge=true` | ✅ Agent 应主动设置 |
| 跨页表格在输出 markdown 中保持单一表格 | ✅ |

### 4.6 用例 T5: 格式转换链式

**Prompt**: "请把 attention-is-all-you-need.pdf 最终转成 docx 给我。"

| 检查项 | 期望 |
|---|---|
| Agent 顺序调用 parse → convert | ✅ |
| 中间 markdown 文件存在 | ✅ |
| 最终 `.docx` 文件可在 Word 打开 | ✅ |
| 总扣分 = `pages × 2 + 1` | ✅ |

### 4.7 用例 T6: 大文件边界（500 页）

**Prompt**: "Parse large-handbook.pdf to markdown."

| 检查项 | 期望 |
|---|---|
| `kolmopdf_estimate_cost` 报出 `pages × 2 = 1000` 积分 | ✅ |
| 若余额不足 → agent 停止并报告 shortfall | ✅ |
| 若余额充足 → 任务完成（端到端可能 5–15 分钟） | ✅ |
| 进度通知 | 客户端有可见进度提示（不被 timeout） |

---

## 5. 错误场景测试用例

### 5.1 E1: 无效 API key

```bash
export KOLMOPDF_API_KEY=sk-invalid
# 重启客户端，调用 /kolmopdf:balance
```

| 期望 |
|---|
| 返回 `invalid_api_key` |
| 提示用户去 `https://www.kolmopdf.com/api-keys` |

### 5.2 E2: 积分不足

测试方法：使用一个余额很低的 key（例如 5 积分）尝试 parse 一个 100 页 PDF。

| 期望 |
|---|
| `kolmopdf_estimate_cost` 返回 `sufficient=false`, `shortfall=195` |
| Agent 应停止而不直接发起 parse |
| 提示用户去 `https://www.kolmopdf.com/subscription` |

### 5.3 E3: 文件 > 300MB

```bash
# 试图 parse oversized-1gb.pdf
```

| 期望 |
|---|
| MCP server 在上传前本地拒绝（`client_local_validation`） |
| 错误信息含 "300MB" |

### 5.4 E4: 文件 > 800 页

| 期望 |
|---|
| MCP server 本地用 pdf-lib 读出 page count > 800 后立即报错 |
| 不发起上传，不扣积分 |

### 5.5 E5: 非 PDF 文件

```bash
# parse 一个 .docx 或 .txt
```

| 期望 |
|---|
| 返回 `parse_file_not_pdf` |
| 不扣积分 |

### 5.6 E6: 错误的 target_format

```bash
# /kolmopdf:convert sample.md --format excel
```

| 期望 |
|---|
| 返回 `convert_target_format_unsupported` |
| 列出合法值 |

### 5.7 E7: 服务端处理超时

无法人为构造，记录在 issue 模板中（用户上报时收集 task_id + log）。client 侧应：

| 期望 |
|---|
| Polling 超过 `KOLMOPDF_MAX_POLL_MINUTES` 后抛 `client_polling_timeout` |
| 提示用户用 `kolmopdf_get_task_status` 查询 |

### 5.8 E8: 网络中断（重试逻辑）

测试方法：用 mitmproxy 或 toxiproxy 模拟随机 5xx。

| 期望 |
|---|
| 单次 HTTP 失败被指数退避重试 3 次后才抛错 |
| Polling 期间偶发失败不中断 |

---

## 6. 性能与质量基准（与 MinerU 对标）

### 6.1 测试集

10 篇 PDF：

| 类型 | 数量 | 来源 |
|---|---|---|
| arxiv 论文（公式密集） | 4 | arxiv.org，2023–2026 |
| IEEE/ACM 标准 | 2 | IEEE Xplore 公开预览 |
| 中日韩技术文档 | 2 | 多语言场景 |
| 含跨页表格 | 1 | 财报或行业报告 |
| 扫描版 PDF（OCR 路径） | 1 | 复印件 |

### 6.2 度量指标

| 指标 | 度量方法 |
|---|---|
| 端到端耗时 | client 计时（含上传 + 排队 + 处理 + 下载） |
| 公式还原率 | 人工抽检 100 条公式，统计 LaTeX 完全正确比例 |
| 表格还原率 | 人工抽检所有表格，统计结构 + 内容完全正确比例 |
| 多栏阅读顺序错误数 | 人工查阅 markdown 中的串行位置 |
| 翻译可读性（仅 T2/T3 用例） | 1–5 主观打分 × 3 人评 |
| 积分成本 | 实际扣分 |

### 6.3 对照组

| 工具 | 调用方式 |
|---|---|
| KolmoPDF | 本插件 |
| MinerU | `mineru-mcp`（VLM 模式） |
| Mistral OCR | `mcp-pdf2md` |
| Claude Code 内置 Read | 仅可用于 ≤ 20 页 |

### 6.4 报告格式

`tests/benchmark/results-<date>.md` 存放原始计时与抽检数据；`tests/benchmark/summary-<date>.csv` 存放统计结果。

---

## 7. CI smoke test 规范

GitHub Actions secret 中注入测试 key 后，nightly 跑：

| 用例 | 输入 | 验证 |
|---|---|---|
| smoke-parse | 1 页测试 PDF | exit 0, markdown_path 存在 |
| smoke-translate | 1 页中文 PDF → en | exit 0, translated_pdf_path 存在 |
| smoke-convert | hello.md → docx | exit 0, docx 存在 |
| smoke-balance | — | exit 0, points > 0 |

每次 smoke 总消耗约 6 积分（2+2+1+0）。月预算 ≈ 200 积分（30 次 × 6）。

---

## 8. 故障排查

| 症状 | 排查 |
|---|---|
| `/plugin install` 后 skill 不出现 | 重启客户端；`/plugin marketplace update kolmopdf` |
| 调用工具报 `Cannot find module @kolmopdf/mcp-server` | npm registry 可达性；本地 `npm cache clean --force` 重试 |
| 任务一直 `waiting` 不进入 `processing` | API 端单 key 上限 3 并发；用 `/kolmopdf:balance` 确认 key 有效 |
| 公式渲染异常 | 检查下游 markdown renderer 是否支持 KaTeX；改用 `formula_format=bracket` |
| 中文乱码 | 检查 markdown 文件 BOM；用 `iconv -f utf-8 -t utf-8 file.md` 标准化 |
| ZIP 解压失败 | 检查 `KOLMOPDF_OUTPUT_DIR` 写入权限 |
| 大文件上传中断 | 拉高 `KOLMOPDF_UPLOAD_TIMEOUT_MS`；检查网络稳定性（mainland China 用户可能需要 proxy） |
| `npx -y` 卡住 | 第一次拉包时间较长，~30s 正常；若超过 2 min 检查 npm registry 配置 |

---

## 9. 用户报告 bug 时收集的最小信息

| 字段 | 获取方式 |
|---|---|
| 客户端版本 | Claude Code: `claude --version` / Codex: `codex --version` |
| Plugin 版本 | `/plugin list` 或查看 `plugin.json` |
| MCP server 版本 | `npx @kolmopdf/mcp-server --version`（若实现） |
| Node 版本 | `node --version` |
| task_id | 失败时工具返回值中 |
| error_code + message | MCP 工具返回内容 |
| 操作系统 | `uname -a` |
| 网络位置 | 是否大陆/海外（影响 KolmoPDF 上行链路） |
