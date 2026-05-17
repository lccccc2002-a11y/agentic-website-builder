export type DesignSystem = {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  fonts: { heading: string; body: string }
  spacing: string
  styleKeywords: string[]
  borderRadius: string
}

export type ProjectFile = { path: string; content: string }

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  isPlan?: boolean
  planData?: {
    plan: string
    changes: string[]
    affectedFiles: string[]
  }
}

export type Project = {
  id: string
  name: string
  designSystem?: DesignSystem
  files: ProjectFile[]
}

// SSE 事件类型（和后端对齐）
export type AgentEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; tool: string; input: unknown }
  | { type: 'file_update'; path: string; content: string }
  | { type: 'plan'; plan: string; changes: string[]; affectedFiles: string[] }
  | { type: 'design_system'; designSystem: DesignSystem }
  | { type: 'done' }
  | { type: 'error'; message: string }
