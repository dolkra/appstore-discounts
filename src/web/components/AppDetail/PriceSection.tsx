/**
 * 价格信息 Tab 面板
 *
 * 顶部 Tab 切换「应用价格 / 各内购项」，
 * 选中后下方依次显示：价格概览卡片 → 历史价格折线图
 */
import { useState } from 'react'
import { useI18n } from '@i18n-pro/react'
import type { PriceHistoryItem } from '@/types'
import PriceChart from '@/components/PriceChart'

interface PriceSectionProps {
  priceHistory: PriceHistoryItem
}

/**
 * 计算折扣幅度百分比
 * @returns 折扣百分比（整数），无折扣时返回 null
 */
function calcDiscountPercent(from: number, to: number): number | null {
  if (from <= 0 || to >= from) return null
  return Math.round(((from - to) / from) * 100)
}

export default function PriceSection({ priceHistory }: PriceSectionProps) {
  const { t } = useI18n()

  /** 全局 tab：app = 应用价格，其余为内购项名称 */
  const [activeTab, setActiveTab] = useState<string>('app')

  // 获取最近一天的快照数据
  const latestSnapshots = priceHistory.history[0]
  const latest = latestSnapshots?.[0]
  const currentPrice = latest?.formattedPrice
  const hasInAppPurchases =
    latest?.inAppPurchases && Object.keys(latest.inAppPurchases).length > 0

  // 内购项名称列表
  const iapNames = hasInAppPurchases ? Object.keys(latest!.inAppPurchases!) : []

  // 计算应用折扣幅度
  const maxPrice = priceHistory.maxPriceInfo.price as number
  const minPrice = priceHistory.minPriceInfo.price as number
  const appDiscountPercent = calcDiscountPercent(maxPrice, minPrice)

  // ---- Tab 页签渲染 ----
  const tabs = [
    { key: 'app', label: t('应用价格') },
    ...iapNames.map((name) => ({ key: name, label: name })),
  ]

  // ---- 价格概览：根据 activeTab 渲染不同内容 ----
  const renderOverview = () => {
    if (activeTab === 'app') {
      // 应用价格概览
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {currentPrice && (
            <div>
              <p className="text-sm text-gray-500">{t('当前价格')}</p>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {currentPrice}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">{t('历史最低价')}</p>
            <p className="text-lg font-bold text-green-600">
              {priceHistory.minPriceInfo.formattedPrice}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('历史最高价')}</p>
            <p className="text-lg font-bold text-red-500">
              {priceHistory.maxPriceInfo.formattedPrice}
            </p>
          </div>
          {appDiscountPercent !== null && (
            <div>
              <p className="text-sm text-gray-500">{t('折扣幅度')}</p>
              <p className="text-lg font-bold text-orange-500">
                {appDiscountPercent}% OFF
              </p>
            </div>
          )}
        </div>
      )
    }

    // 内购项价格概览
    const iapPrice = latest?.inAppPurchases?.[activeTab]
    const iapMin = priceHistory.minPriceInfo[activeTab]
    const iapMax = priceHistory.maxPriceInfo[activeTab]
    const iapMinStr = iapMin != null && iapMin !== '' ? String(iapMin) : null
    const iapMaxStr = iapMax != null && iapMax !== '' ? String(iapMax) : null

    // 计算内购项折扣幅度（解析数值进行比较）
    const iapMaxNum =
      iapMax != null && iapMax !== ''
        ? parseFloat(String(iapMax).replace(/[^\d.]/g, ''))
        : NaN
    const iapMinNum =
      iapMin != null && iapMin !== ''
        ? parseFloat(String(iapMin).replace(/[^\d.]/g, ''))
        : NaN
    const iapDiscountPercent =
      !isNaN(iapMaxNum) && !isNaN(iapMinNum)
        ? calcDiscountPercent(iapMaxNum, iapMinNum)
        : null

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {iapPrice && (
          <div>
            <p className="text-sm text-gray-500">{t('当前价格')}</p>
            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {String(iapPrice)}
            </p>
          </div>
        )}
        {iapMinStr && (
          <div>
            <p className="text-sm text-gray-500">{t('历史最低价')}</p>
            <p className="text-lg font-bold text-green-600">{iapMinStr}</p>
          </div>
        )}
        {iapMaxStr && (
          <div>
            <p className="text-sm text-gray-500">{t('历史最高价')}</p>
            <p className="text-lg font-bold text-red-500">{iapMaxStr}</p>
          </div>
        )}
        {iapDiscountPercent !== null && (
          <div>
            <p className="text-sm text-gray-500">{t('折扣幅度')}</p>
            <p className="text-lg font-bold text-orange-500">
              {iapDiscountPercent}% OFF
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* 顶部全局 Tab：应用价格 | 各内购项 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 价格概览卡片 */}
      <div className="card mb-6">{renderOverview()}</div>

      {/* 历史价格折线图 */}
      <div className="card mb-6">
        <h2 className="mb-3 text-lg font-semibold">{t('历史价格')}</h2>

        {/* 图表 */}
        {activeTab === 'app' ? (
          <PriceChart data={priceHistory} chartMode="app" />
        ) : (
          <PriceChart data={priceHistory} chartMode="iap" iapName={activeTab} />
        )}
      </div>
    </>
  )
}
