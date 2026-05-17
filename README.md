# Agentic Website Builder

把客户品牌描述通过 AI 自动生成风格一致的网站，支持计划确认式迭代修改。

灵感来自 [Lokuma 2.0](https://www.producthunt.com/products/agentic-website-builder-2-0-by-lokuma)，复刻其「改了不乱」的核心能力。

## 核心功能

- **品牌设计系统提取**：描述品牌风格 → AI 自动提取颜色、字体、关键词
- **AI 生成网站**：一键生成完整 HTML（导航、Hero、特性卡片、页脚）
- **Plan-first 编辑**：修改前先展示改动计划，用户确认后执行
- **靶向 Patch**：只改指定区域，不重写整个文件，风格不会跑偏
- **实时预览**：iframe 流式渲染，30-60 秒看到成品
- **一键导出 ZIP**：下载所有代码本地使用

## 项目结构

```
apps/
├── web/        # React + TypeScript + Tailwind 前端
└── api/        # Node Hono 后端 + DeepSeek AI
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React + TypeScript + Tailwind + Vite |
| 后端 | Node Hono (TypeScript) |
| 数据库 | PostgreSQL + Drizzle ORM |
| AI | DeepSeek API（tool use + SSE 流式） |

## 启动方式

```bash
# 后端
cd apps/api
pnpm install
pnpm dev

# 前端
cd apps/web
pnpm install
pnpm dev
```

配置 `apps/api/.env`：
```
DATABASE_URL=postgresql://...
DEEPSEEK_API_KEY=sk-...
```
