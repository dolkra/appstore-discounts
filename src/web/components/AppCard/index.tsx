/**
 * 应用折扣卡片组件
 *
 * 在折扣列表页中以卡片形式展示单个应用的信息，包括：
 * - 应用图标、名称、评分、分类标签
 * - 支持的平台（iOS/iPadOS/macOS 等）
 * - 折扣价格信息（原价、折后价、折扣幅度）
 * - 推送禁用标识（notificationDisabled）
 *
 * 数据来源分为两部分：
 *   - item（DiscountListItem）：折扣数据，来自后端 API，立即可用
 *   - appInfo（CachedAppInfo）：应用元信息，来自 iTunes API，可能延迟加载
 *     当 appInfo 未加载时显示骨架屏占位
 *
 * 整个卡片是可点击的 Link，导航到应用详情页 /:region/:trackId
 */
import { Link } from 'react-router-dom'
import { useI18n } from '@i18n-pro/react'
import type { DiscountListItem, CachedAppInfo } from '@/types'
import PriceTag from '@/components/PriceTag'
import RatingStars from '@/components/RatingStars'
import PlatformTags from '@/components/PlatformTags'
import { getRelativeTime, formatDate } from '@/utils/date'
import { useLocale } from '@/hooks/useLocale'

interface AppCardProps {
  /** 折扣列表项数据（来自后端 API，始终可用） */
  item: DiscountListItem
  /** 应用元信息（来自 iTunes API，懒加载，可能为 undefined 时显示骨架屏） */
  appInfo?: CachedAppInfo
  /** 应用信息查询是否失败（iTunes API 未返回结果，可能已下架） */
  loadError?: boolean
}

export default function AppCard({ item, appInfo, loadError }: AppCardProps) {
  const { t } = useI18n()
  const { locale, withLang } = useLocale()

  return (
    <Link
      to={withLang(`/${item.region}/${item.trackId}`)}
      className="card group block relative"
    >
      <div className="flex gap-3">
        {appInfo ? (
          <img
            src={appInfo.artworkUrl100}
            alt={appInfo.trackName}
            className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        ) : loadError ? (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-2xl dark:bg-red-900/20">
            ⚠️
          </div>
        ) : (
          <div className="skeleton h-16 w-16 flex-shrink-0 rounded-xl" />
        )}

        <div className="min-w-0 flex-1">
          {appInfo ? (
            <div className="flex items-center gap-1">
              <h3 className="truncate font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                {appInfo.trackName}
              </h3>
              {item.notificationDisabled && (
                <span
                  className="flex-shrink-0 cursor-help text-base leading-none"
                  title={t('推送已禁用')}
                >
                  🚫
                </span>
              )}
            </div>
          ) : loadError ? (
            <div>
              <h3 className="font-semibold text-gray-400 dark:text-gray-500">
                {t('加载出错')}
              </h3>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {t('可能已下架')}
              </p>
            </div>
          ) : (
            <div className="skeleton h-5 w-3/4 rounded" />
          )}

          {appInfo && (
            <div className="mt-1 flex items-center gap-2">
              <RatingStars rating={appInfo.averageUserRating} />
              <span className="text-xs text-gray-400">
                {getRelativeTime(
                  item.timestamp,
                  locale === 'zh-CN' ? 'zh-cn' : 'en',
                )}
              </span>
              {item.firstRecordedAt && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-xs text-gray-400" title={t('首次收录')}>
                    📅{' '}
                    {formatDate(
                      item.firstRecordedAt,
                      locale === 'zh-CN' ? 'zh-cn' : 'en',
                    )}
                  </span>
                </>
              )}
            </div>
          )}

          {appInfo && <PlatformTags devices={appInfo.supportedDevices} />}
        </div>
      </div>

      {appInfo && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {appInfo.description}
        </p>
      )}

      {appInfo && appInfo.genres && appInfo.genres.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {appInfo.genres.map((genre, i) => (
            <span
              key={`${genre}-${i}`}
              className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-1 overflow-hidden">
        {item.discounts.map((discount, i) => (
          <PriceTag key={i} discount={discount} />
        ))}
      </div>
    </Link>
  )
}
