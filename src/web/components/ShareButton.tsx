/**
 * 分享按钮组件
 *
 * 提供分享当前页面的能力：
 *   - 移动端优先使用 Web Share API（原生分享面板）
 *   - 降级为复制链接到剪贴板
 *   - 复制成功后显示"已复制"提示
 */
import { useState, useCallback } from 'react'
import { useI18n } from '@i18n-pro/react'

interface ShareButtonProps {
  /** 分享的标题 */
  title: string
  /** 分享的 URL，默认为当前页面 URL */
  url?: string
  /** 按钮额外 CSS 类名 */
  className?: string
}

export default function ShareButton({
  title,
  url,
  className = '',
}: ShareButtonProps) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const shareUrl = url || window.location.href

  const handleShare = useCallback(async () => {
    // 优先使用 Web Share API（移动端原生分享）
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl })
        return
      } catch {
        // 用户取消分享或 API 不可用，降级到复制链接
      }
    }

    // 降级：复制链接到剪贴板
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API 不可用，使用 fallback
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [title, shareUrl])

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${className}`}
    >
      {copied ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-green-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {t('已复制')}
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          {t('分享')}
        </>
      )}
    </button>
  )
}
