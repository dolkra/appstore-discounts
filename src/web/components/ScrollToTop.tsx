/**
 * 回到顶部悬浮按钮
 *
 * 当用户向下滚动超过半屏高度后显示，点击平滑滚动回页面顶部。
 * 按钮使用 fixed 定位，right 位置通过 useContentEdges() 动态计算，
 * 确保始终对齐在内容区域的右外侧边缘（与 DateNav 对称）。
 *
 * 显示/隐藏：
 *   - 通过 scroll 事件监听 window.scrollY
 *   - 使用 CSS transition 实现渐入渐出 + 上移效果
 */
import { useEffect, useState, useRef } from 'react'
import { useContentEdges } from '@/hooks/useContentEdges'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const [footerHeight, setFooterHeight] = useState(0)
  const { contentLeft } = useContentEdges()
  const observerRef = useRef<ResizeObserver | null>(null)

  // 监听 footer 元素高度变化
  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return

    const update = () => setFooterHeight(footer.offsetHeight)
    update()

    // ResizeObserver 精确响应 footer 高度变化（如字体加载、窗口缩放）
    observerRef.current = new ResizeObserver(update)
    observerRef.current.observe(footer)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight / 2)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed z-50 hidden h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition-all duration-300 hover:bg-primary-600 hover:shadow-xl sm:flex ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      style={{
        right: `${Math.max(4, contentLeft - 56)}px`,
        bottom: `${footerHeight + 24}px`,
      }}
      aria-label="Scroll to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}
