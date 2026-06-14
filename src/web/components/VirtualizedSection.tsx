/**
 * 虚拟化区域组件（懒渲染）
 *
 * 使用 IntersectionObserver 实现”可视区域才渲染”的优化策略：
 *   - 当区域进入视口（+rootMargin 缓冲区）时，渲染 children
 *   - 当区域离开视口时，用等高的空白 div 占位，保持滚动条位置稳定
 *
 * 工作流程：
 *   1. 初始状态 isVisible=false，渲染一个 minHeight=estimatedHeight 的占位 div
 *   2. IntersectionObserver 监听 ref 容器是否进入视口
 *   3. 进入视口 → isVisible=true → 渲染真实 children
 *   4. 离开视口 → 若已测量过实际高度 → isVisible=false → 恢复占位 div
 *
 * 为什么需要 measuredHeight？
 *   - 首次加载时使用 estimatedHeight（默认 600px）作为估算
 *   - 一旦真实渲染后即可测量实际高度，避免切换时页面抖动
 *   - 只有测量过高度后才允许”卸载”回占位模式
 *
 * 使用场景：
 *   - DiscountList 中每个日期 section 使用 VirtualizedSection 包裹，
 *     大量折扣数据时避免一次性渲染所有卡片，显著提升首屏性能
 *
 * @param children - 要渲染的内容
 * @param estimatedHeight - 预估区域高度（px），首次渲染前的占位高度
 * @param rootMargin - IntersectionObserver 的根边距，提前触发加载的缓冲距离
 * @param id - 容器 DOM id（用于 DateNav 的 scrollIntoView）
 * @param className - 容器额外 CSS 类名
 */
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'

interface VirtualizedSectionProps {
  children: ReactNode
  /** 首次渲染前的预估高度（px），默认 600 */
  estimatedHeight?: number
  /** IntersectionObserver 的 rootMargin，扩大检测范围，默认 400px */
  rootMargin?: string
  /** 容器 DOM id，供外部 DateNav 等组件定位使用 */
  id?: string
  className?: string
}

export default function VirtualizedSection({
  children,
  estimatedHeight = 600,
  rootMargin = '400px',
  id,
  className,
}: VirtualizedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [measuredHeight, setMeasuredHeight] = useState(estimatedHeight)
  const hasMeasuredRef = useRef(false)

  // 测量实际高度的函数，在子组件渲染完成后调用
  const measureHeight = useCallback(() => {
    const el = ref.current
    if (el && el.offsetHeight > 0) {
      setMeasuredHeight(el.offsetHeight)
      hasMeasuredRef.current = true
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // 延迟测量高度，等待子组件渲染完成
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              measureHeight()
            })
          })
        } else {
          // 只有测量过高度后才允许隐藏
          if (hasMeasuredRef.current) {
            setIsVisible(false)
          }
        }
      },
      { rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, measureHeight])

  return (
    <div ref={ref} id={id} className={className}>
      {isVisible ? children : <div style={{ minHeight: measuredHeight }} />}
    </div>
  )
}
