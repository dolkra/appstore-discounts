/**
 * 主题切换 Hook
 *
 * 功能：
 * 1. 从 localStorage 或系统偏好初始化主题
 * 2. 在 <html> 标签上切换 dark class（配合 Tailwind dark: 变体）
 * 3. 提供 toggleTheme 方法供 UI 调用
 * 4. 通过 MutationObserver 监听 <html> class 变化，实现多实例间主题同步
 *
 * 初始化优先级：localStorage 'theme' > 系统偏好 (prefers-color-scheme) > 默认 'light'
 */
import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light' // SSR 安全
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  // 跨实例同步：监听 <html> class 变化，当其他 useTheme 实例切换主题时自动更新
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setThemeState((prev) => {
        const next: Theme = isDark ? 'dark' : 'light'
        return prev === next ? prev : next
      })
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  // 主题变更时同步到 DOM 和 localStorage
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, toggleTheme }
}
