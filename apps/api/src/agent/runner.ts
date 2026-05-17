import OpenAI from 'openai'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { files, projects } from '../db/schema.js'
import type { DesignSystem } from '../db/schema.js'
import { tools } from './tools.js'
import { buildSystemPrompt } from './prompts.js'

export type AgentEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; tool: string; input: unknown }
  | { type: 'file_update'; path: string; content: string }
  | { type: 'plan'; plan: string; changes: string[]; affectedFiles: string[] }
  | { type: 'design_system'; designSystem: DesignSystem }
  | { type: 'done' }
  | { type: 'error'; message: string }

interface ExtractDesignSystemInput {
  colors: { primary: string; secondary: string; accent: string; background: string; text: string }
  fonts: { heading: string; body: string }
  spacing: string
  styleKeywords: string[]
  borderRadius: string
}
interface WriteFileInput { path: string; content: string }
interface ReadFileInput { path: string }
interface CreatePlanInput { plan: string; affectedFiles: string[]; changes: string[] }
interface ApplyPatchInput { path: string; search: string; replacement: string }

async function readFileFromDB(projectId: string, path: string): Promise<string | null> {
  const rows = await db.select().from(files).where(eq(files.projectId, projectId))
  return rows.find((f) => f.path === path)?.content ?? null
}

async function upsertFileToDB(projectId: string, path: string, content: string): Promise<void> {
  const rows = await db.select().from(files).where(eq(files.projectId, projectId))
  const existing = rows.find((f) => f.path === path)
  if (existing) {
    await db.update(files).set({ content, updatedAt: new Date() }).where(eq(files.id, existing.id))
  } else {
    await db.insert(files).values({ projectId, path, content })
  }
}

function applyPatch(original: string, search: string, replacement: string): string {
  if (!original.includes(search)) {
    throw new Error(`apply_patch 失败：文件中找不到匹配文本。\nsearch 前50字符: ${search.substring(0, 50)}`)
  }
  return original.replace(search, replacement)
}

export async function runAgent(params: {
  projectId: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  designSystem?: DesignSystem
  onEvent: (event: AgentEvent) => void
}): Promise<void> {
  const { projectId, messages, designSystem, onEvent } = params

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  })

  const MAX_ROUNDS = 10

  // 只保留最近 10 条对话历史，避免长历史干扰 AI 判断
  const recentMessages = messages.slice(-10)

  const claudeMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(designSystem) },
    ...recentMessages.map((m) => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
  ]

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const stream = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: claudeMessages,
        tools,
        tool_choice: 'auto',
        stream: true,
      })

      let textContent = ''
      const toolCallsMap: Map<number, { id: string; name: string; args: string }> = new Map()

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        if (!delta) continue

        // 处理文字流
        if (delta.content) {
          textContent += delta.content
          onEvent({ type: 'text', content: delta.content })
        }

        // 累积 tool_calls（流式分片到达）
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index
            if (!toolCallsMap.has(idx)) {
              toolCallsMap.set(idx, { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' })
            }
            const entry = toolCallsMap.get(idx)!
            if (tc.id) entry.id = tc.id
            if (tc.function?.name) entry.name = tc.function.name
            if (tc.function?.arguments) entry.args += tc.function.arguments
          }
        }
      }

      const toolCalls = Array.from(toolCallsMap.values())

      // 没有 tool calls → 正常结束
      if (toolCalls.length === 0) {
        // 把 assistant 消息加入历史
        if (textContent) {
          claudeMessages.push({ role: 'assistant', content: textContent })
        }
        onEvent({ type: 'done' })
        return
      }

      // 把 assistant 消息（含 tool_calls）加入历史
      claudeMessages.push({
        role: 'assistant',
        content: textContent || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.args },
        })),
      })

      let shouldStop = false

      for (const tc of toolCalls) {
        onEvent({ type: 'tool_call', tool: tc.name, input: tc.args })

        let result: string
        try {
          const input = JSON.parse(tc.args)

          switch (tc.name) {
            case 'extract_design_system': {
              const inp = input as ExtractDesignSystemInput
              const ds: DesignSystem = {
                colors: inp.colors,
                fonts: inp.fonts,
                spacing: inp.spacing,
                styleKeywords: inp.styleKeywords,
                borderRadius: inp.borderRadius,
              }
              await db.update(projects).set({ designSystem: ds }).where(eq(projects.id, projectId))
              onEvent({ type: 'design_system', designSystem: ds })
              result = '设计系统已成功提取并保存。'
              break
            }

            case 'write_file': {
              const inp = input as WriteFileInput
              await upsertFileToDB(projectId, inp.path, inp.content)
              onEvent({ type: 'file_update', path: inp.path, content: inp.content })
              result = `文件 ${inp.path} 已写入（${inp.content.length} 字符）。`
              break
            }

            case 'read_file': {
              const inp = input as ReadFileInput
              const content = await readFileFromDB(projectId, inp.path)
              result = content ?? `错误：文件 ${inp.path} 不存在。`
              break
            }

            case 'create_plan': {
              const inp = input as CreatePlanInput
              onEvent({ type: 'plan', plan: inp.plan, changes: inp.changes, affectedFiles: inp.affectedFiles })
              result = '计划已展示给用户，等待确认。'
              shouldStop = true
              break
            }

            case 'apply_patch': {
              const inp = input as ApplyPatchInput
              const current = await readFileFromDB(projectId, inp.path)
              if (current === null) {
                result = `错误：文件 ${inp.path} 不存在。`
              } else {
                const updated = applyPatch(current, inp.search, inp.replacement)
                await upsertFileToDB(projectId, inp.path, updated)
                onEvent({ type: 'file_update', path: inp.path, content: updated })
                result = `文件 ${inp.path} 已成功应用 patch。`
              }
              break
            }

            default:
              result = `未知工具：${tc.name}`
          }
        } catch (err) {
          result = `工具出错：${err instanceof Error ? err.message : String(err)}`
        }

        // 把 tool 结果加入历史
        claudeMessages.push({ role: 'tool', tool_call_id: tc.id, content: result })
      }

      if (shouldStop) {
        onEvent({ type: 'done' })
        return
      }
    }

    onEvent({ type: 'error', message: `超出最大 tool call 轮数（${MAX_ROUNDS}）` })
  } catch (err) {
    onEvent({ type: 'error', message: `Agent 出错：${err instanceof Error ? err.message : String(err)}` })
  }
}
