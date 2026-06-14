/**
 * 应用详情页骨架屏组件
 *
 * 在详情页数据加载完成前，以脉冲动画显示页面布局占位，
 * 包含应用头部卡片、Tab 栏和内容区域的骨架。
 */
export default function AppDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse">
      {/* 应用头部卡片骨架 */}
      <div className="card mb-0 overflow-hidden rounded-b-none">
        {/* 顶部渐变装饰线 */}
        <div className="h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
        <div className="p-5">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="h-20 w-20 flex-shrink-0 rounded-[1.25rem] bg-gray-200 shadow-lg ring-1 ring-black/5 dark:bg-gray-700 sm:h-24 sm:w-24" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-7 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 w-14 rounded-md bg-gray-200 dark:bg-gray-700" />
                <div className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-2 sm:flex-col">
              <div className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab 栏骨架 */}
      <div className="border border-t-0 border-gray-200 dark:border-gray-700">
        <div className="flex">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 py-3 text-center">
              <div className="mx-auto h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>

      {/* 内容区域骨架 */}
      <div className="border border-t-0 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:p-6">
        {/* 价格概览骨架 */}
        <div className="card mb-6">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>

        {/* 图表页签骨架 */}
        <div className="mb-4 flex gap-2">
          <div className="h-8 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* 图表骨架 */}
        <div className="card mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="flex gap-2">
              <div className="h-7 w-12 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-7 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-7 w-12 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          <div className="h-64 rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* 内购项目骨架 */}
        <div className="card mb-6">
          <div className="mb-3 h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700"
              >
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="flex gap-2">
                  <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
