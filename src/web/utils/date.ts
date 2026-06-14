/**
 * 日期工具模块
 *
 * 基于 dayjs 提供日期格式化和分组能力，支持中英文本地化。
 * 使用的 dayjs 插件：
 *   - relativeTime：相对时间描述（如“2小时前”）
 *   - utc：UTC 时间处理
 *   - timezone：时区转换（用于按指定时区分组折扣数据）
 */
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * 获取相对时间描述（如"2小时前"、"3天前"）
 */
export function getRelativeTime(timestamp: number, locale = 'zh-cn'): string {
  return dayjs(timestamp).locale(locale).fromNow()
}

/**
 * 格式化日期（根据语言本地化）
 * 中文：2026年5月23日
 * 英文：May 23, 2026
 */
export function formatDate(timestamp: number, locale = 'zh-cn'): string {
  const d = dayjs(timestamp)
  if (locale === 'zh-cn' || locale === 'zh-CN') {
    return `${d.year()}年${d.month() + 1}月${d.date()}日`
  }
  return d.format('MMM D, YYYY')
}

/**
 * 格式化日期时间
 */
export function formatDateTime(timestamp: number, locale = 'zh-cn'): string {
  const d = dayjs(timestamp)
  if (locale === 'zh-cn' || locale === 'zh-CN') {
    return `${d.year()}年${d.month() + 1}月${d.date()}日 ${d.format('HH:mm')}`
  }
  return d.format('MMM D, YYYY HH:mm')
}

/**
 * 按日期分组折扣列表
 * 根据 timestamp 和时区将折扣项分组到对应日期
 */
export function groupByDate<T extends { timestamp: number }>(
  items: T[],
  timezone?: string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const d = timezone
      ? dayjs(item.timestamp).tz(timezone)
      : dayjs(item.timestamp)
    const dateKey = d.format('YYYY-MM-DD')

    const group = groups.get(dateKey) ?? []
    group.push(item)
    groups.set(dateKey, group)
  }

  return groups
}
