/**
 * 页面底部页脚
 *
 * 固定在页面底部（通过 Layout 的 flex-1 主内容区撑开），
 * 展示版权信息和项目链接。
 */
export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-400">
          <p>
            Built by{' '}
            <a
              href="https://github.com/appstore-discounts/appstore-discounts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              appstore-discounts
            </a>
          </p>
          <p className="mt-1">MIT License &copy; Eyelly Wu</p>
        </div>
      </div>
    </footer>
  )
}
