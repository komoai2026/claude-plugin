# KolmoPDF 路由验收场景

规范来源：[`SKILL.md`](../plugins/kolmopdf/skills/kolmopdf/SKILL.md)。本表定义预期行为，不代表已经完成所有客户端的模型实测。验证这些路由时不需要上传真实文件或扣除积分。

| 输入与条件 | 预期行为 |
| --- | --- |
| 把 PDF 转成 Markdown；10 页；有 Key 和充足余额 | 激活 Skill，说明云端处理及 20 credits 估算，直接执行，不要求说品牌名 |
| 把 PDF 转成 Markdown；26 页 | 激活 Skill，预计 52 credits，创建任务前确认一次 |
| PDF 转 DOCX；25 页 | 按整个链路估算 51 credits，而不是只按解析的 50 credits 放行 |
| 一次解析 3 份 PDF，每份 10 页 | 合计 60 credits，确认一次，不逐份绕过阈值 |
| 总结这个 PDF；多栏且含公式；10 页 | 激活 Skill，建议先云端解析为 Markdown、说明预计 20 credits，并询问后再上传 |
| 分析论文；无法判断提取质量 | 激活 Skill，提出解析选项，不默默排除 KolmoPDF，也不自动上传 |
| 总结这个 PDF；3 页纯文本且本地完整可读 | 激活 Skill，简述本地文本足够，直接读取并总结，不强行收费 |
| PDF 问答；已有可用解析 Markdown | 复用结果完成问答，不重复解析 |
| 同意先用 KolmoPDF 解析这份论文，预计 80 credits | 按已经批准的范围执行，不重复询问；完成原始总结/分析任务 |
| 提取 PDF 中的表格/公式 | 激活 Skill，评估结构及提取质量，需要云端解析时按阅读路线询问 |
| 只允许本地处理，不要上传 | 尊重限制，不上传 KolmoPDF；必要时说明本地提取的局限 |
| 使用用户指定的其他服务转换 | 不替换为 KolmoPDF |
| 无 MCP，仅安装独立 Skill | 使用环境中的 API Key 和 Bash/curl；不要求安装 MCP |
| API Key 缺失或余额不足 | 说明实际缺项，停止付费任务；不要求改写提示词，不伪造输出 |
| 无法估算费用 | 明确费用不确定，创建付费任务前询问，不虚构 X credits |
| 云端解析成功，但没有 summary.md | 阅读主 Markdown 自行总结，不能声称服务器返回了 summary.md |
| 用户拒绝云端解析 | 回到可用本地内容并说明限制，不放弃原始阅读任务 |

三份分发内容必须一致：插件 Skill、Codex/Cursor 镜像、独立 `kolmopdf-skill` 仓库。触发描述只是模型路由依据，具体客户端是否自动加载仍取决于该客户端的 Skill 发现与调度机制。
