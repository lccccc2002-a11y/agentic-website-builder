import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { projects, conversations, files } from '../db/schema.js'

const router = new Hono()

router.post('/', async (c) => {
  const body = await c.req.json<{ name: string }>()
  const [project] = await db.insert(projects).values({ name: body.name }).returning()
  return c.json(project, 201)
})

router.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [project] = await db.select().from(projects).where(eq(projects.id, id))
  if (!project) return c.json({ error: 'Not found' }, 404)

  const projectFiles = await db.select().from(files).where(eq(files.projectId, id))
  const msgs = await db.select().from(conversations).where(eq(conversations.projectId, id))

  return c.json({ ...project, files: projectFiles, conversations: msgs })
})

export default router
