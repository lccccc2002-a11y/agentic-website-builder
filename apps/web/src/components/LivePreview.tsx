import { useEffect, useRef, useState } from 'react'
import { Globe } from 'lucide-react'
import { buildPreviewHtml, createPreviewUrl } from '@/lib/preview'
import type { ProjectFile } from '@/types'

interface LivePreviewProps {
  files: ProjectFile[]
}

export default function LivePreview({ files }: LivePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const prevUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // 没有文件时清空预览
    if (files.length === 0) {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
        prevUrlRef.current = null
      }
      setPreviewUrl(null)
      return
    }

    const html = buildPreviewHtml(files)

    // 只有 index.html 才有意义展示
    const hasHtml = files.some((f) => f.path.endsWith('.html'))
    if (!hasHtml) return

    const newUrl = createPreviewUrl(html)

    // 释放旧的 blob URL，避免内存泄漏
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
    }
    prevUrlRef.current = newUrl
    setPreviewUrl(newUrl)

    // 组件卸载时也要释放
    return () => {
      URL.revokeObjectURL(newUrl)
    }
  }, [files])

  if (!previewUrl) {
    return (
      <div className="relative w-full h-full bg-gray-950 flex flex-col items-center justify-center gap-4 text-gray-600">
        {/* 网格背景装饰 */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(55,65,81,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(55,65,81,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
            <Globe className="w-7 h-7 text-gray-700" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-gray-500 font-medium">等待 AI 生成网站...</p>
            <p className="text-gray-700 text-sm">在左侧描述你的需求，预览会实时更新</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative bg-gray-950">
      {/* 顶部装饰栏（模拟浏览器地址栏） */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 mx-2">
          <div className="bg-gray-800 rounded-md px-3 py-1 text-gray-500 text-xs font-mono max-w-[280px] mx-auto truncate">
            preview://your-website
          </div>
        </div>
      </div>

      {/* 预览 iframe */}
      <iframe
        src={previewUrl}
        sandbox="allow-scripts"
        title="网站预览"
        className="w-full border-0"
        style={{ height: 'calc(100% - 41px)' }}
      />
    </div>
  )
}
