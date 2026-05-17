import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { projects, conversations, files } from '../db/schema.js'
import { runAgent } from '../agent/runner.js'
import type { AgentEvent } from '../agent/runner.js'
import type { DesignSystem } from '../db/schema.js'
import archiver from 'archiver'

const router = new Hono()

// SSE 聊天接口
router.post('/:id/chat', async (c) => {
  const projectId = c.req.param('id')
  const body = await c.req.json<{ message: string; confirmedPlan?: boolean }>()

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId))
  if (!project) return c.json({ error: 'Project not found' }, 404)

  // 存用户消息
  const userMessage = body.confirmedPlan
    ? `${body.message}\n[用户已确认计划，请执行改动]`
    : body.message

  await db.insert(conversations).values({ projectId, role: 'user', content: userMessage })

  // 读取历史消息
  const history = await db
    .select()
    .from(conversations)
    .where(eq(conversations.projectId, projectId))

  const messages = history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content }))

  return streamSSE(c, async (stream) => {
    let assistantText = ''

    const onEvent = async (event: AgentEvent) => {
      if (event.type === 'text') {
        assistantText += event.content
      }
      await stream.writeSSE({ data: JSON.stringify(event) })
    }

    await runAgent({
      projectId,
      messages,
      designSystem: project.designSystem as DesignSystem | undefined,
      onEvent,
    })

    // 存 assistant 消息
    if (assistantText) {
      await db.insert(conversations).values({ projectId, role: 'assistant', content: assistantText })
    }
  })
})

// 导出 ZIP
router.get('/:id/export', async (c) => {
  const projectId = c.req.param('id')
  const projectFiles = await db.select().from(files).where(eq(files.projectId, projectId))

  return new Response(
    new ReadableStream({
      start(controller) {
        const archive = archiver('zip', { zlib: { level: 9 } })

        archive.on('data', (chunk) => controller.enqueue(chunk))
        archive.on('end', () => controller.close())
        archive.on('error', (err) => controller.error(err))

        for (const file of projectFiles) {
          archive.append(file.content, { name: file.path })
        }

        archive.finalize()
      },
    }),
    {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="website-${projectId}.zip"`,
      },
    }
  )
})

export default router
