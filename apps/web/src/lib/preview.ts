import type { ProjectFile } from '@/types'

// 把文件列表合并成可在 iframe 显示的完整 HTML
export function buildPreviewHtml(files: ProjectFile[]): string {
  const indexFile = files.find((f) => f.path === 'index.html') ?? files.find((f) => f.path.endsWith('.html'))
  const cssFile = files.find((f) => f.path === 'style.css' || f.path === 'styles.css')
  const jsFile = files.find((f) => f.path === 'script.js' || f.path === 'main.js')

  // 没有 index.html 时生成占位 HTML
  if (!indexFile) {
    return `<!DOCTYPE html><html><body><p>等待生成...</p></body></html>`
  }

  let html = indexFile.content

  // 把外链 CSS 替换为 inline style 标签
  if (cssFile) {
    const styleTag = `<style>\n${cssFile.content}\n</style>`
    // 尝试替换 <link> 标签，找不到就注入到 </head> 前
    const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/i
    if (linkRegex.test(html)) {
      html = html.replace(linkRegex, styleTag)
    } else {
      html = html.replace('</head>', `${styleTag}\n</head>`)
    }
  }

  // 把外链 JS 替换为 inline script 标签
  if (jsFile) {
    const scriptTag = `<script>\n${jsFile.content}\n<\/script>`
    // 尝试替换 <script src="..."> 标签，找不到就注入到 </body> 前
    const scriptRegex = /<script[^>]+src=["'][^"']*["'][^>]*><\/script>/i
    if (scriptRegex.test(html)) {
      html = html.replace(scriptRegex, scriptTag)
    } else {
      html = html.replace('</body>', `${scriptTag}\n</body>`)
    }
  }

  return html
}

// 生成 blob URL 供 iframe 使用
export function createPreviewUrl(html: string): string {
  const blob = new Blob([html], { type: 'text/html' })
  return URL.createObjectURL(blob)
}
