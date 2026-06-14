/**
 * 星级评分组件
 *
 * 将 0-5 的数字评分渲染为可视化的星星序列（★/☆）。
 * 支持半星显示，基于四舍五入到 0.5 精度。
 *
 * 实现细节：
 *   - HalfStar 组件：使用 CSS clip-path 将空心星 ☆ 只叠加在实心星 ★ 的右半部分，
 *     实现半星效果（无需 SVG 或图片）
 *   - 评分数值显示在星星右侧（如 "4.5"）
 */

interface RatingStarsProps {
  /** 评分值（0-5 可带小数） */
  rating: number
}

/**
 * 半星组件
 * 叠加实心星和裁切过的空心星，视觉上只显示半颗星
 */
function HalfStar() {
  return (
    <span className="relative inline-block w-min leading-none">
      {/* Full star as base */}
      <span className="opacity-100">★</span>
      {/* Hollow star overlaid on right half */}
      <span
        className="absolute inset-0 opacity-100"
        style={{ clipPath: 'inset(0 0 0 50%)' }}
      >
        ☆
      </span>
    </span>
  )
}

function Star({ filled }: { filled: boolean }) {
  return <span className="leading-none">{filled ? '★' : '☆'}</span>
}

export default function RatingStars({ rating }: RatingStarsProps) {
  const rounded = Math.round(rating * 2) / 2
  const fullCount = Math.floor(rounded)
  const hasHalf = rounded % 1 !== 0
  const emptyCount = 5 - fullCount - (hasHalf ? 1 : 0)

  return (
    <span className="inline-flex items-center text-sm text-yellow-500">
      {Array.from({ length: fullCount }, (_, i) => (
        <Star key={`f-${i}`} filled />
      ))}
      {hasHalf && <HalfStar />}
      {Array.from({ length: emptyCount }, (_, i) => (
        <Star key={`e-${i}`} filled={false} />
      ))}
      <span className="ml-1 text-gray-500 dark:text-gray-400">
        {rating.toFixed(1)}
      </span>
    </span>
  )
}
