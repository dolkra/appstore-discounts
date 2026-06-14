/**
 * 设备与平台工具模块
 *
 * 从 iTunes API 返回的 supportedDevices 列表中解析出应用支持的平台（iOS/iPadOS/macOS 等）。
 * supportedDevices 格式示例：["iPhone5s-iPhone5s", "iPadAir-iPadAir", ...]
 *
 * 提供：
 *   - parsePlatforms()：解析设备列表 → 平台标签数组
 *   - getPlatformIcon()：平台 → emoji 图标
 *   - formatFileSize()：字节数 → 可读文件大小字符串
 */

/**
 * 从 supportedDevices 列表中解析出应用支持的平台标签
 * supportedDevices 格式如 ["iPhone5s-iPhone5s", "iPadAir-iPadAir", ...]
 */

export type Platform = 'iOS' | 'iPadOS' | 'macOS' | 'watchOS' | 'tvOS'

const PLATFORM_PATTERNS: Record<Platform, RegExp> = {
  iOS: /^iPhone|^iPod/,
  iPadOS: /^iPad/,
  macOS: /^Mac/,
  watchOS: /^Watch/,
  tvOS: /^AppleTV/,
}

export function parsePlatforms(supportedDevices?: string[] | null): Platform[] {
  const platforms = new Set<Platform>()

  if (!supportedDevices) return []

  for (const device of supportedDevices) {
    for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
      if (pattern.test(device)) {
        platforms.add(platform as Platform)
      }
    }
  }

  return Array.from(platforms)
}

export function getPlatformIcon(platform: Platform): string {
  const icons: Record<Platform, string> = {
    iOS: '📱',
    iPadOS: '📟',
    macOS: '💻',
    watchOS: '⌚',
    tvOS: '📺',
  }
  return icons[platform] ?? '📱'
}

export function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  if (isNaN(size) || size <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let fileSize = size

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024
    unitIndex++
  }

  return `${fileSize.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}
