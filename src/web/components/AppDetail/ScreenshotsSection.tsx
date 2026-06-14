/**
 * 应用截图展示组件
 *
 * 展示应用的截图，支持点击放大查看。
 * 根据应用类型（kind）智能显示平台标签：
 * - iOS 应用：显示 iPhone、iPad、Apple TV 截图
 * - macOS 应用：显示 Mac 截图
 * - watchOS 应用：暂无截图
 *
 * 截图数据来自 iTunes API 的 screenshotUrls、ipadScreenshotUrls、appletvScreenshotUrls 字段。
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { useI18n } from '@i18n-pro/react'

interface ScreenshotsSectionProps {
  /** 应用类型（software=iOS, macSoftware=macOS, etc.） */
  kind?: string
  /** iPhone/Mac 截图 URL 列表（根据 kind 判断是 iPhone 还是 Mac 截图） */
  screenshotUrls?: string[]
  /** iPad 截图 URL 列表 */
  ipadScreenshotUrls?: string[]
  /** Apple TV 截图 URL 列表 */
  appletvScreenshotUrls?: string[]
}

export default function ScreenshotsSection({
  kind,
  screenshotUrls,
  ipadScreenshotUrls,
  appletvScreenshotUrls,
}: ScreenshotsSectionProps) {
  const { t } = useI18n()
  /** 当前预览图片在合并列表中的索引，-1 表示未打开 */
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // 根据 kind 判断主截图平台
  const isMacApp = kind === 'mac-software'
  const isWatchApp = kind === 'watch-software'
  const isTVApp = kind === 'tv-software'

  const primaryScreenshots = screenshotUrls || []
  const ipadScreenshots = ipadScreenshotUrls || []
  const appletvScreenshots = appletvScreenshotUrls || []

  // 合并所有截图为一个列表，方便上一张/下一张切换
  const allScreenshots = [
    ...primaryScreenshots,
    ...ipadScreenshots,
    ...appletvScreenshots,
  ]
  const hasScreenshots = allScreenshots.length > 0

  // 根据应用类型确定主截图的平台标签
  const getPrimaryPlatformLabel = () => {
    if (isMacApp) return 'Mac'
    if (isTVApp) return 'Apple TV'
    return 'iPhone'
  }

  const showPrev = useCallback(() => {
    setSelectedIndex((prev) =>
      prev <= 0 ? allScreenshots.length - 1 : prev - 1,
    )
  }, [allScreenshots.length])

  const showNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev >= allScreenshots.length - 1 ? 0 : prev + 1,
    )
  }, [allScreenshots.length])

  const close = useCallback(() => setSelectedIndex(-1), [])

  /** 移动端触摸滑动支持 */
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      touchStartRef.current = null

      // 水平滑动距离大于 50px 且大于垂直距离时触发切换
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          showNext() // 左滑 → 下一张
        } else {
          showPrev() // 右滑 → 上一张
        }
      }
    },
    [showPrev, showNext],
  )

  /** 键盘左右箭头切换、ESC 关闭 */
  useEffect(() => {
    if (selectedIndex < 0) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') showPrev()
      else if (e.key === 'ArrowRight') showNext()
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedIndex, showPrev, showNext, close])

  if (!hasScreenshots) {
    return (
      <div className="card p-6 text-center text-gray-500 dark:text-gray-400">
        {t('暂无截图')}
      </div>
    )
  }

  return (
    <>
      {/* 主平台截图（iPhone/Mac/Apple TV） */}
      {primaryScreenshots.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            {getPrimaryPlatformLabel()}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {primaryScreenshots.map((url, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
              >
                <img
                  src={url}
                  alt={`${getPrimaryPlatformLabel()} ${t('截图')} ${index + 1}`}
                  loading="lazy"
                  className="h-auto w-48 rounded-xl border border-gray-200 shadow-sm dark:border-gray-700 sm:w-56"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* iPad 截图（仅非 macOS 应用显示） */}
      {!isMacApp && !isWatchApp && !isTVApp && ipadScreenshots.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            iPad
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {ipadScreenshots.map((url, index) => (
              <button
                key={index}
                type="button"
                onClick={() =>
                  setSelectedIndex(primaryScreenshots.length + index)
                }
                className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
              >
                <img
                  src={url}
                  alt={`iPad ${t('截图')} ${index + 1}`}
                  loading="lazy"
                  className="h-auto w-64 rounded-xl border border-gray-200 shadow-sm dark:border-gray-700 sm:w-72"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Apple TV 截图（仅非 Apple TV 应用显示） */}
      {!isTVApp && appletvScreenshots.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Apple TV
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {appletvScreenshots.map((url, index) => (
              <button
                key={index}
                type="button"
                onClick={() =>
                  setSelectedIndex(
                    primaryScreenshots.length + ipadScreenshots.length + index,
                  )
                }
                className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
              >
                <img
                  src={url}
                  alt={`Apple TV ${t('截图')} ${index + 1}`}
                  loading="lazy"
                  className="h-auto w-64 rounded-xl border border-gray-200 shadow-sm dark:border-gray-700 sm:w-72"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 图片预览模态框（支持上一张/下一张 + 移动端滑动切换） */}
      {selectedIndex >= 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 整体布局：左侧按钮 + 图片 + 右侧按钮 */}
          <div
            className="flex max-h-[90vh] items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 上一张按钮（图片左侧） */}
            {allScreenshots.length > 1 && (
              <button
                type="button"
                onClick={showPrev}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-xl text-gray-800 shadow-lg transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-white dark:hover:bg-gray-800"
                aria-label={t('上一张')}
              >
                ‹
              </button>
            )}

            <img
              src={allScreenshots[selectedIndex]}
              alt={`${t('截图预览')} ${selectedIndex + 1}/${
                allScreenshots.length
              }`}
              className="max-h-[90vh] max-w-[75vw] rounded-xl object-contain"
            />

            {/* 下一张按钮（图片右侧） */}
            {allScreenshots.length > 1 && (
              <button
                type="button"
                onClick={showNext}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-xl text-gray-800 shadow-lg transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-white dark:hover:bg-gray-800"
                aria-label={t('下一张')}
              >
                ›
              </button>
            )}
          </div>

          {/* 关闭按钮（模态框右上角） */}
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg transition-transform hover:scale-110 dark:bg-gray-800 dark:text-white"
          >
            ✕
          </button>

          {/* 页码指示器（底部居中） */}
          {allScreenshots.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
              {selectedIndex + 1} / {allScreenshots.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
