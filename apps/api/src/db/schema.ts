import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export type DesignSystem = {
  colors: { primary: string; secondary: string; accent: string; background: string; text: string }
  fonts: { heading: string; body: string }
  spacing: string
  styleKeywords: string[]
  borderRadius: string
}

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  designSystem: jsonb('design_system').$type<DesignSystem>(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  path: text('path').notNull(),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
