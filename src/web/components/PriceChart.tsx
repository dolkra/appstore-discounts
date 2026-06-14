/**
 * 价格走势图表组件
 *
 * 基于 Chart.js + react-chartjs2 的交互式折线图，展示应用的历史价格变化。
 * 支持以下功能：
 *   - 应用价格线（主折线 + 面积填充）
 *   - App 内购买项目价格线（每个内购项独立颜色）
 *   - 历史最低价/最高价虚线标注
 *   - 鼠标滚轮/触控板缩放 + 拖拽平移（chartjs-plugin-zoom）
 *
 * 数据处理流程：
 *   1. 将嵌套的 history 数组平铺并按时间排序
 *   2. 构建 Chart.js datasets：App 价格线 + 各内购项价格线 + 最低/最高价参考线
 *   3. 内购价格从字符串中提取数值（去除货币符号等非数字字符）
 *
 * 使用的 Chart.js 插件：
 *   - chartjs-plugin-zoom：支持图表缩放和拖拽
 *   - hammerjs：为 zoom 插件提供触控手势支持
 */
import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartDataset,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import 'hammerjs'
import { Line } from 'react-chartjs-2'
import { useI18n } from '@i18n-pro/react'
import type { PriceHistoryItem } from '@/types'
import dayjs from 'dayjs'

// 注册 Chart.js 所需组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin,
)

interface PriceChartProps {
  /** 价格历史数据（包含历史记录和最高最低价信息） */
  data: PriceHistoryItem
  /** 图表模式：'app' 显示应用价格，'iap' 显示指定内购项价格 */
  chartMode?: 'app' | 'iap'
  /** 内购项名称（chartMode='iap' 时必填） */
  iapName?: string
}

/** 折线颜色配置（应用价格 + 不同内购项） */
const LINE_COLORS = [
  { border: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { border: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { border: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { border: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { border: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { border: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
]

export default function PriceChart({
  data,
  chartMode = 'app',
  iapName,
}: PriceChartProps) {
  const { t } = useI18n()

  const chartData = useMemo(() => {
    const allSnapshots = data.history
      .flat()
      .sort((a, b) => a.timestamp - b.timestamp)

    const filtered = allSnapshots

    if (filtered.length === 0) return null

    const labels = filtered.map((s) => dayjs(s.timestamp).format('MM/DD HH:mm'))

    if (chartMode === 'app') {
      // App price line
      const priceLine = {
        label: t('应用价格'),
        data: filtered.map((s) => s.price),
        borderColor: LINE_COLORS[0].border,
        backgroundColor: LINE_COLORS[0].bg,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
      }

      const minPrice = data.minPriceInfo.price
      const maxPrice = data.maxPriceInfo.price

      const minLine = {
        label: `${t('最低价')} (${data.minPriceInfo.formattedPrice})`,
        data: Array(filtered.length).fill(minPrice),
        borderColor: 'rgba(239,68,68,0.5)',
        borderDash: [6, 4],
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      }

      const maxLine = {
        label: `${t('最高价')} (${data.maxPriceInfo.formattedPrice})`,
        data: Array(filtered.length).fill(maxPrice),
        borderColor: 'rgba(239,68,68,0.3)',
        borderDash: [4, 4],
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      }

      return {
        labels,
        datasets: [priceLine, minLine, maxLine],
      }
    }

    // IAP mode
    if (!iapName) return null
    const iapColor = LINE_COLORS[1]

    const iapLine = {
      label: iapName,
      data: filtered.map((s) => {
        const val = s.inAppPurchases?.[iapName]
        if (!val) return null
        const num = parseFloat(String(val).replace(/[^\d.]/g, ''))
        return isNaN(num) ? null : num
      }),
      borderColor: iapColor.border,
      backgroundColor: iapColor.bg,
      fill: false,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: true,
    }

    const iapMinVal = data.minPriceInfo[iapName]
    const iapMaxVal = data.maxPriceInfo[iapName]

    const datasets: ChartDataset<'line'>[] = [iapLine]

    if (typeof iapMinVal === 'number' && iapMinVal > 0) {
      const iapMinFormatted =
        data.minPriceInfo[`${iapName}_formatted`] || String(iapMinVal)
      datasets.push({
        label: `${t('最低价')} (${iapMinFormatted})`,
        data: Array(filtered.length).fill(iapMinVal),
        borderColor: 'rgba(239,68,68,0.5)',
        borderDash: [6, 4],
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      })
    }

    if (typeof iapMaxVal === 'number' && iapMaxVal > 0) {
      const iapMaxFormatted =
        data.maxPriceInfo[`${iapName}_formatted`] || String(iapMaxVal)
      datasets.push({
        label: `${t('最高价')} (${iapMaxFormatted})`,
        data: Array(filtered.length).fill(iapMaxVal),
        borderColor: 'rgba(239,68,68,0.3)',
        borderDash: [4, 4],
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      })
    }

    return {
      labels,
      datasets,
    }
  }, [data, chartMode, iapName])

  if (!chartData) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        No price data available
      </div>
    )
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 16,
          filter: (item) =>
            !item.text.startsWith(t('最低价')) &&
            !item.text.startsWith(t('最高价')),
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const value = ctx.parsed.y
            if (value === null) return undefined
            return `${ctx.dataset.label}: ${value}`
          },
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
        limits: {
          x: { minRange: 5 },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 10,
          maxRotation: 45,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value,
        },
      },
    },
  }

  return (
    <div className="h-80 w-full sm:h-96">
      <Line data={chartData} options={options} />
    </div>
  )
}
