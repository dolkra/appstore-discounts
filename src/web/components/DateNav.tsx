/**
 * 日期快速导航栏组件
 *
 * 固定在页面左侧（仅 xl 及以上屏幕显示），列出所有折扣日期的快捷按钮。
 * 用户点击某日期时，平滑滚动到对应日期区域；滚动页面时自动高亮当前可见的日期。
 *
 * 核心设计：
 *   1. 位置计算：使用 useContentEdges() 获取内容区域左边界，将导航栏定位在内容区左侧外
 *   2. 滚动监听：通过 scroll 事件 + offset 判断当前可见的日期 section
 *   3. 互斥滚动：ignoringScrollRef 用于在平滑滚动过程中暂停自动高亮，
 *      避免平滑滚动时高亮频繁跳动
 *   4. 自动跟随：高亮的按钮会通过 scrollIntoView 自动滚入导航栏可视区域
 *
 * 页面使用流程：
 *   - DiscountList 初始化时将 sectionRefs 注册到每个日期 section
 *   - 用户点击 DateNav 按钮 → invoke onDateClick → DiscountList.handleDateClick
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { useContentEdges } from '@/hooks/useContentEdges'

/** Ref 标记类型，用于引用父组件的 ref 对象 */
type RefReady<T> = { current: T }

interface DateNavProps {
  /** 所有可用日期的键列表（格式如 '2026-05-23'） */
  dates: string[]
  /** 点击日期时的回调，由父组件 DiscountList 提供 */
  onDateClick: (dateKey: string) => void
  /** 标记是否正在平滑滚动中（暂停自动高亮） */
  ignoringScrollRef: RefReady<boolean>
}

/** 将 ISO 日期键格式化为短格式：2026-05-23 → 2026/05/23 */
function formatShortDate(dateKey: string): string {
  const parts = dateKey.split('-')
  if (parts.length !== 3) return dateKey
  return `${parts[0]}/${parts[1]}/${parts[2]}`
}

export default function DateNav({
  dates,
  onDateClick,
  ignoringScrollRef,
}: DateNavProps) {
  const [activeDate, setActiveDate] = useState<string>('')
  const navRef = useRef<HTMLDivElement>(null)
  const { contentLeft } = useContentEdges()

  // Auto-scroll active date into view within the nav container
  useEffect(() => {
    if (!navRef.current || !activeDate) return
    const activeBtn = navRef.current.querySelector(
      `[data-date="${activeDate}"]`,
    )
    if (activeBtn) {
      activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeDate])

  const handleScroll = useCallback(() => {
    if (ignoringScrollRef.current) return
    const HEADER_OFFSET = 80
    for (const dateKey of dates) {
      const el = document.getElementById(`date-${dateKey}`)
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.top <= HEADER_OFFSET + 10 && rect.bottom > HEADER_OFFSET) {
          setActiveDate(dateKey)
          break
        }
      }
    }
  }, [dates, ignoringScrollRef])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  if (dates.length === 0) return null

  // 将 DateNav 完全放在内容区域左侧外，不遮挡内容
  // 估算按钮最大宽度约 76px，加上 8px 间距
  const navLeft = Math.max(4, contentLeft - 84)

  return (
    <div
      ref={navRef}
      className="date-nav-scroll fixed z-40 hidden overflow-y-auto xl:block"
      style={{ top: '4.5rem', bottom: '6rem', left: `${navLeft}px` }}
    >
      <nav className="flex flex-col gap-0.5 py-2">
        {dates.map((dateKey) => {
          const isActive = activeDate === dateKey
          return (
            <button
              key={dateKey}
              data-date={dateKey}
              onClick={() => onDateClick(dateKey)}
              className={`whitespace-nowrap rounded px-2 py-1 text-center text-xs transition-colors ${
                isActive
                  ? 'bg-primary-500 font-medium text-white'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {formatShortDate(dateKey)}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
