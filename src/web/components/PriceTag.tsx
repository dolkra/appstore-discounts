/**
 * 折扣价格标签组件
 *
 * 展示单条折扣信息：折扣类型名称、原价（删除线）、折后价、折扣幅度百分比、历史价格区间。
 * 根据 calculateDiscountPercent 的返回值动态显示折扣标签。
 *
 * 使用场景：
 *   - AppCard 中：展示每个应用的折扣列表
 *   - AppDetail 中：无（详情页有独立的价格展示区域）
 */
import type { Discount } from '@/types'
import { calculateDiscountPercent } from '@/utils/price'

interface PriceTagProps {
  /** 折扣信息（包含类型、原价、折后价等） */
  discount: Discount
}

/**
 * 解析历史价格区间字符串
 * 输入格式："[¥28.00 ~ ¥68.00]"
 * 返回：{ low: "¥28.00", high: "¥68.00" } 或 null
 */
function parseRange(range: string): { low: string; high: string } | null {
  if (!range) return null
  const match = range.match(/\[(.+?)\s*~\s*(.+?)]/)
  if (!match) return null
  return { low: match[1].trim(), high: match[2].trim() }
}

export default function PriceTag({ discount }: PriceTagProps) {
  const percent = calculateDiscountPercent(discount.from, discount.to)
  const rangeInfo = parseRange(discount.range)

  return (
    <div className="flex items-center gap-1.5 overflow-hidden text-sm">
      <span className="badge flex-shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        {discount.name}
      </span>
      <span className="flex-shrink-0 text-gray-400 line-through">
        {discount.from}
      </span>
      <span
        className={`flex-shrink-0 font-semibold ${
          percent !== null
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}
      >
        {discount.to}
      </span>
      {percent !== null && (
        <span className="badge flex-shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          -{percent}%
        </span>
      )}
      {rangeInfo && (
        <span className="ml-auto flex-shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400">
          📈 {rangeInfo.low} ~ {rangeInfo.high}
        </span>
      )}
    </div>
  )
}
