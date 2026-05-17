import type { AgentEvent, Project } from '@/types'

const API_BASE = 'http://localhost:3001/api'

// 创建项目
export async function createProject(name: string): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`创建项目失败: ${res.statusText}`)
  return res.json() as Promise<{ id: string }>
}

// 获取项目
export async function getProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`)
  if (!res.ok) throw new Error(`获取项目失败: ${res.statusText}`)
  return res.json() as Promise<Project>
}

// 发送消息，返回 async generator 逐条 yield SSE 事件
export async function* sendMessage(
  projectId: string,
  message: string,
  confirmedPlan?: boolean
): AsyncGenerator<AgentEvent> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, confirmedPlan }),
  })

  if (!response.ok) throw new Error(`请求失败: ${response.statusText}`)
  if (!response.body) throw new Error('响应体为空')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    // 最后一行可能不完整，留到下次拼接
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = line.slice(6).trim()
        if (json) {
          try {
            yield JSON.parse(json) as AgentEvent
          } catch {
            console.error('SSE JSON 解析失败:', json)
          }
        }
      }
    }
  }
}

// 导出 ZIP，触发浏览器下载
export async function exportProject(projectId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/export`)
  if (!res.ok) throw new Error(`导出失败: ${res.statusText}`)

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `project-${projectId}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
