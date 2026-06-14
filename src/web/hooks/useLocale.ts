/**
 * 语言偏好 Hook
 *
 * 功能：
 * 1. 从 URL 查询参数 ?lang= 读取当前语言（主要来源）
 * 2. 切换语言时同步更新 URL（?lang=）、localStorage 和 <html lang="...">
 * 3. 提供 withLang(path) 工具函数，为内部链接自动附加 ?lang= 参数
 *
 * 初始化优先级：URL ?lang= > localStorage 'locale' > navigator.language > 默认 'zh-CN'
 */
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

type Locale = 'zh-CN' | 'en'

function isValidLocale(v: string | null): v is Locale {
  return v === 'zh-CN' || v === 'en'
}

/** 从 localStorage 或浏览器语言推断初始语言（仅用于无 URL 参数时的 fallback） */
function inferLocale(): Locale {
  if (typeof window === 'undefined') return 'zh-CN'
  const stored = localStorage.getItem('locale')
  if (isValidLocale(stored)) return stored
  return navigator.language.startsWith('zh') ? 'zh-CN' : 'en'
}

/**
 * 直接从 window.location.search 读取 ?lang= 参数
 * 同步且可靠，不依赖 React Router 的渲染时序
 */
function getLocaleFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('lang')
}

/** 综合 URL / localStorage / 浏览器语言推断初始语言 */
function getInitialLocale(): Locale {
  const fromUrl = getLocaleFromUrl()
  if (isValidLocale(fromUrl)) return fromUrl
  return inferLocale()
}

export function useLocale() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  // URL ?lang= 参数变化时同步更新 locale（如通过浏览器前进/后退）
  const urlLang = searchParams.get('lang')
  useEffect(() => {
    if (isValidLocale(urlLang) && urlLang !== locale) {
      setLocaleState(urlLang)
      localStorage.setItem('locale', urlLang)
      document.documentElement.lang = urlLang
    }
  }, [urlLang, locale])

  /**
   * 设置新语言并同步到 URL、localStorage 及 <html> 标签
   * 注：i18n-pro 的 locale 需要在调用处通过 setI18n 单独同步
   */
  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('lang', newLocale)
          return next
        },
        { replace: true },
      )
      localStorage.setItem('locale', newLocale)
      document.documentElement.lang = newLocale
    },
    [setSearchParams],
  )

  /**
   * 为内部路径附加当前语言参数
   * 例如 withLang('/cn/apps') → '/cn/apps?lang=zh-CN'
   */
  const withLang = useCallback(
    (path: string) => {
      const separator = path.includes('?') ? '&' : '?'
      return `${path}${separator}lang=${locale}`
    },
    [locale],
  )

  return { locale, setLocale, withLang }
}
