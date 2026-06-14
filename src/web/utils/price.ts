/**
 * 价格工具模块
 *
 * 提供价格解析、折扣计算等能力。
 *
 * 核心难点：全球各地区的货币格式差异较大：
 *   - 中国：¥68.00
 *   - 美国：$9.99
 *   - 欧洲：€5,99（逗号作小数点）
 *   - 台湾：NT$170
 *   还需处理“免费”、“Free”等文本
 */
import type { Discount } from '@/types'

/**
 * 计算折扣幅度百分比
 * @param from 原价字符串（如 "¥68.00"）
 * @param to 折扣价字符串（如 "¥38.00"）
 * @returns 折扣百分比（如 44 表示打 4.4 折 / 降价 56%），返回 null 表示无法计算
 */
export function calculateDiscountPercent(
  from: string,
  to: string,
): number | null {
  const fromPrice = parsePrice(from)
  const toPrice = parsePrice(to)

  if (fromPrice <= 0 || toPrice < 0 || toPrice >= fromPrice) return null

  return Math.round(((fromPrice - toPrice) / fromPrice) * 100)
}

/**
 * 从格式化价格字符串中解析出数值
 * 支持多种货币格式：¥68.00、$9.99、€5.99、HK$52.00、NT$170.00 等
 */
export function parsePrice(priceStr: string): number {
  if (!priceStr) return 0

  // 处理免费
  if (/免费|free/i.test(priceStr)) return 0

  // 移除货币符号和空格，保留数字和小数点
  const cleaned = priceStr.replace(/[^\d.,]/g, '')

  // 处理不同地区的数字格式
  // 欧洲格式：1.234,56 = 1234.56
  const hasCommaAsDecimal =
    cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
  let normalized = cleaned
  if (hasCommaAsDecimal) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = cleaned.replace(/,/g, '')
  }

  const price = parseFloat(normalized)
  return isNaN(price) ? 0 : price
}

/**
 * 判断是否有价格折扣
 */
export function hasDiscount(discounts: Discount[]): boolean {
  return discounts.length > 0
}

/**
 * 获取主要折扣信息（用于卡片展示）
 * 优先显示应用价格折扣，其次显示内购折扣
 */
export function getPrimaryDiscount(discounts: Discount[]): Discount | null {
  if (discounts.length === 0) return null

  // 优先返回价格类型的折扣
  const priceDiscount = discounts.find((d) => d.type === 'price')
  if (priceDiscount) return priceDiscount

  // 返回第一个内购折扣
  return discounts[0]
}
