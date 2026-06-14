/**
 * 评论 Tab 面板
 *
 * 基于 GitHub Discussions 的 Giscus 评论区，
 * 使用 pathname mapping 将评论与页面路径自动绑定。
 */
import GiscusComments from '@/components/GiscusComments'

export default function CommentsSection() {
  return (
    <div className="card">
      <GiscusComments />
    </div>
  )
}
