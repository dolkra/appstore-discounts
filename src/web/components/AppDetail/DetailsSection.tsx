/**
 * 应用详情 Tab 面板
 *
 * 展示应用的元信息：
 *   - 应用信息卡片（版本、大小、系统要求、内容分级等）
 *   - 应用描述
 *   - 更新日志（如有）
 */
import { useI18n } from '@i18n-pro/react'
import type { CachedAppInfo } from '@/types'
import { formatFileSize } from '@/utils/device'

interface DetailsSectionProps {
  appInfo: CachedAppInfo
}

export default function DetailsSection({ appInfo }: DetailsSectionProps) {
  const { t } = useI18n()

  return (
    <>
      {/* 应用详细信息（版本、大小、系统要求等） */}
      <div className="card mb-6">
        <h2 className="mb-3 text-lg font-semibold">{t('应用信息')}</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500">{t('版本')}</dt>
          <dd>{appInfo.version}</dd>
          <dt className="text-gray-500">{t('大小')}</dt>
          <dd>{formatFileSize(appInfo.fileSizeBytes)}</dd>
          <dt className="text-gray-500">{t('最低系统要求')}</dt>
          <dd>iOS {appInfo.minimumOsVersion}</dd>
          <dt className="text-gray-500">{t('内容分级')}</dt>
          <dd>{appInfo.contentAdvisoryRating}</dd>
          <dt className="text-gray-500">{t('更新时间')}</dt>
          <dd>{appInfo.currentVersionReleaseDate}</dd>
          {appInfo.languageCodesISO2A &&
            appInfo.languageCodesISO2A.length > 0 && (
              <>
                <dt className="text-gray-500">{t('支持语言')}</dt>
                <dd className="flex flex-wrap gap-1">
                  {appInfo.languageCodesISO2A.map((lang) => (
                    <span
                      key={lang}
                      className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {lang}
                    </span>
                  ))}
                </dd>
              </>
            )}
        </dl>
      </div>

      {/* 应用描述 */}
      <div className="card mb-6">
        <h2 className="mb-3 text-lg font-semibold">{t('应用描述')}</h2>
        <p className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
          {appInfo.description}
        </p>
      </div>

      {/* 更新日志（版本说明）：仅在应用提供更新日志时显示 */}
      {appInfo.releaseNotes && (
        <div className="card mb-6">
          <h2 className="mb-3 text-lg font-semibold">{t('更新日志')}</h2>
          <p className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
            {appInfo.releaseNotes}
          </p>
        </div>
      )}
    </>
  )
}
