import type OpenAI from 'openai'

export const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'extract_design_system',
      description: '从用户描述中提取品牌设计规则，保存为设计系统。在用户描述品牌风格后调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          colors: {
            type: 'object',
            properties: {
              primary: { type: 'string', description: '主色，hex 格式如 #1A73E8' },
              secondary: { type: 'string', description: '辅色' },
              accent: { type: 'string', description: '强调色' },
              background: { type: 'string', description: '背景色' },
              text: { type: 'string', description: '文字色' },
            },
            required: ['primary', 'secondary', 'accent', 'background', 'text'],
          },
          fonts: {
            type: 'object',
            properties: {
              heading: { type: 'string', description: '标题字体，如 Inter, Playfair Display' },
              body: { type: 'string', description: '正文字体' },
            },
            required: ['heading', 'body'],
          },
          spacing: { type: 'string', description: '基础间距单位，如 8px' },
          styleKeywords: {
            type: 'array',
            items: { type: 'string' },
            description: '风格关键词，如 ["minimal", "modern", "dark"]',
          },
          borderRadius: { type: 'string', description: '圆角大小，如 8px, 0px, 16px' },
        },
        required: ['colors', 'fonts', 'spacing', 'styleKeywords', 'borderRadius'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: '写入完整文件内容。仅在初始生成阶段使用。生成的 HTML 必须把 CSS 和 JS 全部 inline，不引用外部文件。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径，如 index.html' },
          content: { type: 'string', description: '文件完整内容' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: '读取当前文件内容，在执行 apply_patch 前先读取文件确认内容。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '要读取的文件路径' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_plan',
      description: '在执行任何修改前，先向用户展示改动计划等待确认。必须在调用 apply_patch 前先调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          plan: { type: 'string', description: '改动计划的总体说明' },
          affectedFiles: {
            type: 'array',
            items: { type: 'string' },
            description: '将被修改的文件列表',
          },
          changes: {
            type: 'array',
            items: { type: 'string' },
            description: '具体改动列表，每条描述一个改动',
          },
        },
        required: ['plan', 'affectedFiles', 'changes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_patch',
      description: '靶向替换文件中的特定区域，不重写整个文件。必须先用 read_file 确认 search 内容存在。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '要修改的文件路径' },
          search: { type: 'string', description: '要被替换的精确文本（必须在文件中存在）' },
          replacement: { type: 'string', description: '替换后的新文本' },
        },
        required: ['path', 'search', 'replacement'],
      },
    },
  },
]
