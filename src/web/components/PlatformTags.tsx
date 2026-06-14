/**
 * 平台标签组件
 *
 * 从 iTunes API 返回的 supportedDevices 数组中解析出应用支持的平台（iOS/iPadOS/macOS 等），
 * 并以带 emoji 图标的标签形式展示。
 *
 * 依赖：
 *   - parsePlatforms()：从设备名称数组中识别平台
 *   - getPlatformIcon()：平台 → emoji（如 iOS → 📱, macOS → 💻）
 */
import { parsePlatforms, getPlatformIcon } from '@/utils/device'

interface PlatformTagsProps {
  /** iTunes API 返回的 supportedDevices 数组 */
  devices: string[]
}

export default function PlatformTags({ devices }: PlatformTagsProps) {
  const platforms = parsePlatforms(devices)

  if (platforms.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {platforms.map((p) => (
        <span
          key={p}
          className="badge bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        >
          {getPlatformIcon(p)} {p}
        </span>
      ))}
    </div>
  )
}
