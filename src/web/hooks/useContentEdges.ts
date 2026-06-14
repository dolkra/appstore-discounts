/**
 * 内容区域边界 Hook
 *
 * 追踪页面内容区域（max-w-7xl = 80rem = 1280px）相对于视口的左/右边界坐标。
 * 用于将 fixed 定位的 UI 元素（DateNav 日期导航、ScrollToTop 按钮等）
 * 精确对齐到内容区域的外侧边缘，避免遮挡内容。
 *
 * 使用场景：
 * - DateNav.tsx: 计算日期导航栏的 left 位置
 * - ScrollToTop.tsx: 计算回到顶部按钮的 right 位置
 */
import { useState, useEffect, useCallback } from 'react'

// max-w-7xl = 80rem
const CONTENT_MAX_WIDTH_REM = 80
const REM_PX = 16

/**
 * 追踪页面内容区域（max-w-7xl）相对于视口的左/右边界
 * 用于将 fixed 定位的 UI 元素（日期导航、按钮等）对齐到内容区域边缘
 */
export function useContentEdges() {
  /** 计算当前视口宽度对应的内容区域左右边界 */
  const update = useCallback(() => {
    const vw = window.innerWidth
    const maxPx = CONTENT_MAX_WIDTH_REM * REM_PX
    const contentWidth = Math.min(vw, maxPx)
    const contentLeft = (vw - contentWidth) / 2

    return { contentLeft, contentRight: contentLeft + contentWidth }
  }, [])

  const [edges, setEdges] = useState(update)

  useEffect(() => {
    const handler = () => setEdges(update())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [update])

  return edges
}
