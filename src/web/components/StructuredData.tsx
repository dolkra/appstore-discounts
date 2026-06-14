/**
 * 结构化数据（JSON-LD）组件
 *
 * 向页面注入 <script type="application/ld+json"> 标签，
 * 用于向搜索引擎提供结构化数据（Schema.org），改善搜索结果的展示效果。
 *
 * 使用场景：
 *   - 应用详情页注入 SoftwareApplication schema，
 *     包含应用名称、描述、价格、评分等信息
 *
 * 组件卸载时自动清理注入的 script 标签，防止内存泄漏。
 */
import { useEffect } from 'react'

interface StructuredDataProps {
  /** JSON-LD 结构化数据对象 */
  data: Record<string, unknown>
}

export default function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [data])

  return null
}
