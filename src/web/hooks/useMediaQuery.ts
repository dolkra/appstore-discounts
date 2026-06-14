/**
 * CSS 媒体查询响应式 Hook 系列
 *
 * 提供响应式的断点检测能力：
 * - useMediaQuery(query) — 通用媒体查询 Hook
 * - useIsMobile()  — 移动端（< 768px）
 * - useIsTablet()  — 平板（768px - 1023px）
 * - useIsDesktop() — 桌面端（>= 1024px）
 *
 * 实现原理：使用 window.matchMedia 监听媒体查询变化，实时返回布尔值。
 * 注：SSR 环境下默认返回 false。
 */
import { useState, useEffect } from 'react'

/**
 * 通用媒体查询 Hook
 * @param query - CSS 媒体查询字符串，如 '(max-width: 767px)'
 * @returns 当前是否匹配
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
