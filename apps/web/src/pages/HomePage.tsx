import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { createProject } from '@/lib/api'

export default function HomePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    const trimmed = name.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    try {
      const { id } = await createProject(trimmed)
      navigate(`/builder/${id}`)
    } catch (err) {
      console.error('创建项目失败:', err)
      setError(err instanceof Error ? err.message : '创建项目失败，请重试')
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleStart()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* 背景装饰光晕 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8">
        {/* 图标 */}
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30">
          <Sparkles className="w-8 h-8 text-blue-400" />
        </div>

        {/* 标题区 */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Build Your Website
            <br />
            with AI
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
            描述你的品牌需求，AI 先出改动计划，你确认后再执行。
            <br />
            <span className="text-gray-500 text-sm">Plan-first，每一步都在你掌控中。</span>
          </p>
        </div>

        {/* 卖点列表 */}
        <div className="flex gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            计划确认再执行
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            实时预览
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            一键导出代码
          </div>
        </div>

        {/* 输入区 */}
        <div className="w-full space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="给你的网站起个名字，例如：Coffee Studio"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleStart}
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-6 py-3.5 rounded-xl transition-colors whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  开始构建
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm px-1">{error}</p>
          )}

          <p className="text-gray-600 text-xs text-center">
            按 Enter 快速开始
          </p>
        </div>
      </div>

      {/* 底部说明 */}
      <p className="absolute bottom-6 text-gray-700 text-xs">
        Agentic Website Builder · Powered by Claude
      </p>
    </div>
  )
}
