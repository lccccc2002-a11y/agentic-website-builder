# Spec Studio

把客户原始反馈（访谈、工单、用户评价）通过 AI 自动转成结构化的产品需求文档（PRD）。

> 灵感来自 [mia (gomia.ai)](https://www.gomia.ai/)，复刻其「客户信号 → 可执行 spec」的核心切片。

---

## 项目结构

```
spec-studio/
├── api/                # 后端：Python FastAPI，调 DeepSeek 生成 PRD
├── web/                # 前端：Next.js + Tailwind + shadcn
└── .claude/
    └── plan-spec-generator.md   # 完整规划文档（AI 助手用）
```

## 准备工作（只需一次）

### 1. 装基础工具

如果还没装：

```bash
# pnpm（前端用）
npm install -g pnpm

# uv（后端用）
brew install uv
```

### 2. 拿 DeepSeek API Key

访问 https://platform.deepseek.com/ 注册账号，充值（最低 ¥10），生成 API Key。

把 key 写到 `api/.env` 文件里：

```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

> ⚠️ `.env` 已经在 `.gitignore` 里，不会被提交。**不要分享 key 给别人**。

---

## 启动（每次开发用）

需要开**两个终端窗口**。

### 终端 1 — 启动后端

```bash
cd api
uv run uvicorn main:app --reload --port 8000
```

看到 `Uvicorn running on http://0.0.0.0:8000` 就 OK。

### 终端 2 — 启动前端

```bash
cd web
pnpm dev
```

看到 `Local: http://localhost:3000` 就 OK。

### 浏览器打开

访问 [http://localhost:3000](http://localhost:3000)

---

## 怎么用

1. 把客户反馈文本（访谈、工单、用户评价）粘到左边大输入框
2. 点击 **Generate Spec** 按钮
3. 等约 30 秒，右侧会出现 AI 生成的 PRD
4. 点击 **Copy as Markdown** 复制结果，粘到 Cursor / Notion / 任何地方继续用

---

## 排错

| 问题 | 怎么办 |
|---|---|
| `Cannot reach backend` | 后端没启动，看终端 1 |
| `Backend not configured` | `api/.env` 没填 DEEPSEEK_API_KEY |
| 端口 8000 被占 | 换端口：`--port 8001`，并改 `web/.env.local` 的 URL |
| 端口 3000 被占 | Next.js 会自动用 3001 |
| AI 生成质量差 | 改 `api/app/prompts/*.md`，不用动代码 |

---

## 调整 AI 行为

不用懂 Python 也能改 AI 提示词：

- `api/app/prompts/analyze.md` — 控制怎么从原始反馈抽取痛点
- `api/app/prompts/generate_spec.md` — 控制 PRD 文档的结构和风格

改完保存即可，下次生成自动生效（uvicorn `--reload` 会监听变化）。

---

## 路线图

- ✅ **M1**（当前）— 跑通最小流程
- ⏳ **M2** — 加账号系统、数据库、项目管理
- ⏳ **M3** — 流式生成、PDF/Cursor 格式导出、官网首页
- 💡 **M4**（可选）— Word/PDF 文件上传、版本对比

详情见 [.claude/plan-spec-generator.md](.claude/plan-spec-generator.md)
