/**
 * 应用卡片骨架屏组件
 *
 * 在折扣数据和应用元信息尚未加载完成时，
 * 以脉冲动画（animate-pulse）显示卡片布局占位，
 * 提升用户感知的加载速度。
 */
export default function AppCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex gap-3">
        <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}
