/**
 * Giscus 评论组件
 *
 * 使用 @giscus/react 官方组件集成 GitHub Discussions 评论系统。
 * pathname mapping 将评论与页面路径自动绑定。
 *
 * 配置参考：https://giscus.app/
 *   - repo: appstore-discounts/discussions
 *   - category: Announcements
 *   - mapping: pathname（按 URL 路径匹配讨论）
 */
import Giscus from '@giscus/react'
import { useTheme } from '@/hooks/useTheme'
import { useLocale } from '@/hooks/useLocale'

export default function GiscusComments() {
  const { theme } = useTheme()
  const { locale } = useLocale()

  return (
    <div className="mt-6">
      <Giscus
        id="comments"
        repo="appstore-discounts/discussions"
        repoId="R_kgDOSyAI8Q"
        category="Announcements"
        categoryId="DIC_kwDOSyAI8c4C-kYh"
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={theme === 'dark' ? 'dark' : 'light'}
        lang={locale === 'zh-CN' ? 'zh-CN' : 'en'}
        loading="lazy"
      />
    </div>
  )
}
