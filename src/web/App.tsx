/**
 * 应用根组件
 *
 * 职责：
 * 1. 管理全局 Provider 层级：i18n 国际化 → Layout 布局 → 路由
 * 2. 初始化主题（useTheme 会在 <html> 上设置 dark class）
 * 3. 根据 locale 切换 i18n 语言
 * 4. 使用 React.lazy + Suspense 实现页面级代码分割
 *
 * 路由结构：
 *   /           → 重定向到 /cn
 *   /:region    → 折扣列表页（按地区筛选）
 *   /:region/:trackId → 应用详情页
 *   /:region/apps → 应用列表页
 *   /:region/about → 关于页面
 */
import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { I18nProvider, useI18n } from '@i18n-pro/react'
import { useTheme } from '@/hooks/useTheme'
import { useLocale } from '@/hooks/useLocale'
import Layout from '@/components/Layout'
import initI18nState from '@/i18n'

// 路由级代码分割：每个页面单独打包，首屏只加载当前路由的代码
const DiscountList = lazy(() => import('@/pages/DiscountList'))
const AppDetail = lazy(() => import('@/pages/AppDetail'))
const About = lazy(() => import('@/pages/About'))
const Apps = lazy(() => import('./pages/Apps'))
const NotFound = lazy(() => import('@/pages/NotFound'))

/** 根路径重定向：保留 ?lang= 等查询参数 */
function HomeRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/cn${search}`} replace />
}

/**
 * 语言同步组件（必须在 I18nProvider 内部使用）
 * 通过 setI18n 将 URL 中的 ?lang= 同步到 i18n-pro 内部状态
 */
function LocaleSync({ locale }: { locale: string }) {
  const { setI18n } = useI18n()

  useEffect(() => {
    setI18n({ locale })
    document.documentElement.lang = locale
  }, [locale, setI18n])

  return null
}

export default function App() {
  // 初始化主题，监听系统偏好与 localStorage
  useTheme()
  const { locale } = useLocale()

  return (
    <I18nProvider {...initI18nState} locale={locale}>
      <LocaleSync locale={locale} />
      <Layout>
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
              {/* 页面标题骨架 */}
              <div className="mb-6 h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
              {/* 卡片网格骨架 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex gap-3">
                      <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </div>
                    <div className="mt-3 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="mt-2 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="mt-3 h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/:region" element={<DiscountList />} />
            <Route path="/:region/apps" element={<Apps />} />
            <Route path="/:region/about" element={<About />} />
            <Route path="/:region/:trackId" element={<AppDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </I18nProvider>
  )
}
