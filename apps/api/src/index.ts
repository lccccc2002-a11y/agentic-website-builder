import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import projectsRouter from './routes/projects.js'
import chatRouter from './routes/chat.js'

const app = new Hono()

app.use('*', cors({ origin: 'http://localhost:5173', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }))

app.route('/api/projects', projectsRouter)
app.route('/api/projects', chatRouter)

app.get('/health', (c) => c.json({ status: 'ok' }))

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log('API running on http://localhost:3001')
})
