import { useState } from 'react'
import { Send } from 'lucide-react'
import type { DesignSystem } from '@/types'

interface StylePanelProps {
  designSystem: DesignSystem
  onSend: (text: string) => void
  isLoading: boolean
}

// 快捷提示词分组
const QUICK_PROMPTS: { label: string; prompts: string[] }[] = [
  {
    label: '配色',
    prompts: ['配色改成深色系', '配色改成清新明亮', '配色改成黑金高级感', '配色改成柔和莫兰迪'],
  },
  {
    label: '字体',
    prompts: ['字体改得更现代简约', '字体改得更优雅衬线', '字体改得更圆润亲切'],
  },
  {
    label: '风格',
    prompts: ['整体风格更简约', '整体风格更奢华', '整体风格更活泼年轻', '整体风格更专业商务'],
  },
  {
    label: '布局',
    prompts: ['Hero 区做得更大气', '卡片区加阴影效果', '整体间距更宽松'],
  },
]

export default function StylePanel({ designSystem, onSend, isLoading }: StylePanelProps) {
  const [input, setInput] = useState('')
  const { colors, fonts, styleKeywords } = designSystem

  const colorEntries = [
    { label: '主色', value: colors.primary },
    { label: '辅色', value: colors.secondary },
    { label: '强调', value: colors.accent },
    { label: '背景', value: colors.background },
    { label: '文字', value: colors.text },
  ]

  function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    onSend(text)
    setInput('')
  }

  function handleChipClick(prompt: string) {
    if (isLoading) return
    setInput((prev) => {
      const trimmed = prev.trim()
      // 已经包含这条就移除（反选），否则追加
      if (trimmed.includes(prompt)) {
        return trimmed.replace(prompt, '').replace(/[，,]\s*$/, '').replace(/^\s*[，,]/, '').trim()
      }
      return trimmed ? `${trimmed}，${prompt}` : prompt
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div className="border-b border-gray-800 bg-gray-900/60 space-y-3 px-4 pt-3 pb-3">

      {/* 当前设计系统（紧凑展示） */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* 色块 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs shrink-0">配色</span>
          <div className="flex gap-1.5">
            {colorEntries.map((c) => (
              <div
                key={c.label}
                title={`${c.label}: ${c.value}`}
                className="w-5 h-5 rounded-md border border-white/10 cursor-default"
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        {/* 风格标签 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {styleKeywords.slice(0, 3).map((kw) => (
            <span
              key={kw}
              className="text-blue-300 text-xs bg-blue-900/30 border border-blue-800/50 px-1.5 py-0.5 rounded"
            >
              {kw}
            </span>
          ))}
        </div>

        {/* 字体缩写 */}
        <span className="text-gray-500 text-xs truncate max-w-[120px]" title={fonts.heading}>
          {fonts.heading.split(',')[0].replace(/['"]/g, '')}
        </span>
      </div>

      {/* 快捷提示词 chips */}
      <div className="space-y-1.5">
        {QUICK_PROMPTS.map((group) => (
          <div key={group.label} className="flex items-start gap-2">
            <span className="text-gray-600 text-xs pt-0.5 shrink-0 w-6">{group.label}</span>
            <div className="flex flex-wrap gap-1.5">
              {group.prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleChipClick(p)}
                  disabled={isLoading}
                  className={[
                    'text-xs px-2 py-0.5 rounded-full border transition-colors',
                    input.includes(p)
                      ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200',
                    isLoading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 自定义输入框 */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="输入修改指令，例如：把按钮改成圆角胶囊样式..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/60 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Send className="w-3 h-3" />
          确定
        </button>
      </div>

    </div>
  )
}
