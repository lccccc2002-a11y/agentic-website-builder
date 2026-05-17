import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, Loader2, ArrowLeft } from 'lucide-react'
import { getProject, sendMessage, exportProject } from '@/lib/api'
import ChatPanel from '@/components/ChatPanel'
import LivePreview from '@/components/LivePreview'
import type { ChatMessage, DesignSystem, ProjectFile, AgentEvent } from '@/types'

// 生成唯一 ID
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function BuilderPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [designSystem, setDesignSystem] = useState<DesignSystem | undefined>()
  const [pendingPlan, setPendingPlan] = useState<AgentEvent & { type: 'plan' } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [initError, setInitError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // 当前正在流式追加的 assistant 消息 ID
  const streamingMsgIdRef = useRef<string | null>(null)

  // 加载已有项目数据
  useEffect(() => {
    if (!projectId) return

    getProject(projectId)
      .then((project) => {
        setProjectName(project.name)
        setFiles(project.files ?? [])
        if (project.designSystem) setDesignSystem(project.designSystem)
      })
      .catch((err) => {
        console.error('加载项目失败:', err)
        setInitError('加载项目失败，请返回重试')
      })
  }, [projectId])

  // 分发 SSE 事件（用 ref 包装避免 handleSend 循环依赖）
  const handleAgentEvent = useCallback((event: AgentEvent) => {
    switch (event.type) {
      case 'text': {
        setMessages((prev) => {
          const streamId = streamingMsgIdRef.current
          if (streamId) {
            return prev.map((m) =>
              m.id === streamId ? { ...m, content: m.content + event.content } : m
            )
          }
          const newId = uid()
          streamingMsgIdRef.current = newId
          return [...prev, { id: newId, role: 'assistant' as const, content: event.content }]
        })
        break
      }

      case 'file_update': {
        setFiles((prev) => {
          const idx = prev.findIndex((f) => f.path === event.path)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = { path: event.path, content: event.content }
            return next
          }
          return [...prev, { path: event.path, content: event.content }]
        })
        streamingMsgIdRef.current = null
        break
      }

      case 'plan': {
        streamingMsgIdRef.current = null
        setPendingPlan(event)
        const planMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: '',
          isPlan: true,
          planData: {
            plan: event.plan,
            changes: event.changes,
            affectedFiles: event.affectedFiles,
          },
        }
        setMessages((prev) => [...prev, planMsg])
        setIsLoading(false)
        break
      }

      case 'design_system': {
        setDesignSystem(event.designSystem)
        streamingMsgIdRef.current = null
        break
      }

      case 'done': {
        streamingMsgIdRef.current = null
        setIsLoading(false)
        break
      }

      case 'error': {
        streamingMsgIdRef.current = null
        setIsLoading(false)
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: 'assistant' as const, content: `错误：${event.message}` },
        ])
        break
      }

      default:
        break
    }
  }, [])

  // 处理用户发送消息
  const handleSend = useCallback(async (text: string, confirmedPlan?: boolean) => {
    if (!projectId || isLoading) return

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    streamingMsgIdRef.current = null

    try {
      for await (const event of sendMessage(projectId, text, confirmedPlan)) {
        handleAgentEvent(event)
      }
    } catch (err) {
      console.error('发送消息失败:', err)
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant' as const, content: '出错了，请稍后重试。' },
      ])
    } finally {
      setIsLoading(false)
      streamingMsgIdRef.current = null
    }
  }, [projectId, isLoading, handleAgentEvent])

  // 用户确认计划 → 直接重发最后一条用户消息，带 confirmedPlan=true
  // 注意：不能在 setMessages 回调里触发副作用，会被 React 调用两次
  const handleConfirmPlan = useCallback(() => {
    if (!pendingPlan) return
    setPendingPlan(null)
    const lastUser = [...messages].reverse().find((m) => m.role === 'user' && !m.isPlan)
    if (lastUser) {
      handleSend(lastUser.content, true)
    }
  }, [pendingPlan, handleSend, messages])

  // 用户拒绝计划
  const handleRejectPlan = useCallback(() => {
    setPendingPlan(null)
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: 'assistant' as const,
        content: '好的，已取消本次改动。如需调整，请告诉我新的需求。',
      },
    ])
  }, [])

  // 导出 ZIP
  async function handleExport() {
    if (!projectId || exporting) return
    setExporting(true)
    try {
      await exportProject(projectId)
    } catch (err) {
      console.error('导出失败:', err)
    } finally {
      setExporting(false)
    }
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">{initError}</p>
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white text-sm underline"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <span className="text-white font-medium text-sm truncate max-w-[200px]">
            {projectName || '加载中...'}
          </span>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || files.length === 0}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
        >
          {exporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          导出 ZIP
        </button>
      </header>

      {/* 主体：左侧聊天 + 右侧预览 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧聊天面板 35% */}
        <div className="w-[35%] min-w-[320px] border-r border-gray-800 flex flex-col">
          <ChatPanel
            messages={messages}
            designSystem={designSystem}
            isLoading={isLoading}
            pendingPlan={pendingPlan}
            onSend={(text) => handleSend(text)}
            onConfirmPlan={handleConfirmPlan}
            onRejectPlan={handleRejectPlan}
          />
        </div>

        {/* 右侧预览区 65% */}
        <div className="flex-1 overflow-hidden">
          <LivePreview files={files} />
        </div>
      </div>
    </div>
  )
}
