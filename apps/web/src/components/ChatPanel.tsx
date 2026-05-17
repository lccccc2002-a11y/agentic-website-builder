import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, AlertTriangle, CheckCircle, XCircle, FileCode } from 'lucide-react'
import StylePanel from '@/components/StylePanel'
import type { ChatMessage, DesignSystem, AgentEvent } from '@/types'

// 计划确认卡片（内嵌在消息流中）
function PlanConfirmCard({
  planData,
  onConfirm,
  onReject,
  resolved,
}: {
  planData: NonNullable<ChatMessage['planData']>
  onConfirm: () => void
  onReject: () => void
  resolved: boolean
}) {
  return (
    <div className="rounded-xl border border-yellow-600/40 bg-yellow-950/30 overflow-hidden">
      {/* 卡片头 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-yellow-600/30 bg-yellow-900/20">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-yellow-300 font-medium text-sm">AI 改动计划</span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* plan 文字 */}
        <p className="text-gray-200 text-sm leading-relaxed">{planData.plan}</p>

        {/* 改动列表 */}
        {planData.changes.length > 0 && (
          <div className="space-y-1">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">改动内容</p>
            <ul className="space-y-1">
              {planData.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 受影响文件 */}
        {planData.affectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {planData.affectedFiles.map((file) => (
              <span
                key={file}
                className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded"
              >
                <FileCode className="w-3 h-3" />
                {file}
              </span>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        {!resolved && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={onConfirm}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              确认执行
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              取消
            </button>
          </div>
        )}

        {resolved && (
          <p className="text-gray-500 text-xs italic">计划已处理</p>
        )}
      </div>
    </div>
  )
}

// 单条消息气泡
function MessageBubble({
  message,
  onConfirmPlan,
  onRejectPlan,
  planResolved,
}: {
  message: ChatMessage
  onConfirmPlan: () => void
  onRejectPlan: () => void
  planResolved: boolean
}) {
  const isUser = message.role === 'user'

  if (message.isPlan && message.planData) {
    return (
      <div className="w-full px-1">
        <PlanConfirmCard
          planData={message.planData}
          onConfirm={onConfirmPlan}
          onReject={onRejectPlan}
          resolved={planResolved}
        />
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700/50',
        ].join(' ')}
      >
        {message.content || (
          // 流式加载中的占位光标
          <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  )
}

interface ChatPanelProps {
  messages: ChatMessage[]
  designSystem: DesignSystem | undefined
  isLoading: boolean
  pendingPlan: (AgentEvent & { type: 'plan' }) | null
  onSend: (text: string) => void
  onConfirmPlan: () => void
  onRejectPlan: () => void
}


export default function ChatPanel({
  messages,
  designSystem,
  isLoading,
  pendingPlan,
  onSend,
  onConfirmPlan,
  onRejectPlan,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 消息更新时自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = inputText.trim()
    if (!text || isLoading || pendingPlan) return
    setInputText('')
    onSend(text)
    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // textarea 自动扩展高度
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const canSend = inputText.trim().length > 0 && !isLoading && !pendingPlan

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* 设计系统 + 快捷指令区 */}
      {designSystem && (
        <StylePanel
          designSystem={designSystem}
          onSend={onSend}
          isLoading={isLoading}
        />
      )}

      {/* 消息历史 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-gray-500">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
              <Send className="w-5 h-5 text-gray-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-400">开始描述你的网站需求</p>
              <p className="text-xs text-gray-600">
                例如：帮我做一个咖啡品牌官网，风格简约温暖
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onConfirmPlan={onConfirmPlan}
            onRejectPlan={onRejectPlan}
            // 当 pendingPlan 已清空（null）说明计划已被处理
            planResolved={msg.isPlan ? pendingPlan === null : false}
          />
        ))}

        {/* loading 指示器 */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700/50 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-gray-400 text-xs">AI 正在生成网站，约需 30-60 秒...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="shrink-0 border-t border-gray-800 p-3">
        {pendingPlan && (
          <div className="mb-2 px-1 py-1.5 text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800/40 rounded-lg text-center">
            请先处理上方的改动计划后再继续对话
          </div>
        )}
        <div className="flex items-end gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 focus-within:border-blue-500/60 transition-colors">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={pendingPlan ? '等待计划确认...' : '描述你的需求...（Enter 发送，Shift+Enter 换行）'}
            disabled={isLoading || !!pendingPlan}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-sm resize-none focus:outline-none min-h-[24px] max-h-[160px] disabled:opacity-50"
            style={{ height: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors mb-0.5"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
