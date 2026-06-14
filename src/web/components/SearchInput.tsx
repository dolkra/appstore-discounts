/**
 * 搜索输入框组件（带 300ms 防抖）
 *
 * 功能：
 *   - 搜索图标 + 输入框 + 清除按钮
 *   - 300ms 防抖后通过 onChange 回调通知父组件
 *   - 支持 placeholder 自定义
 *
 * 使用方式：
 *   <SearchInput
 *     value={query}
 *     onChange={setQuery}
 *     placeholder={t('搜索应用名称...')}
 *   />
 */
import { useState, useEffect, useRef } from 'react'
import { useI18n } from '@i18n-pro/react'

interface SearchInputProps {
  /** 当前搜索关键词（受控） */
  value: string
  /** 防抖后的值变化回调 */
  onChange: (value: string) => void
  /** 输入框占位文本 */
  placeholder?: string
  /** 防抖延迟（毫秒），默认 300 */
  debounceMs?: number
}

export default function SearchInput({
  value,
  onChange,
  placeholder = '搜索...',
  debounceMs = 300,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { t } = useI18n()

  // 外部 value 变化时同步到内部状态（如切换地区清空搜索）
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // 防抖：输入变化后延迟 onChange 回调
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(inputValue)
    }, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [inputValue, onChange, debounceMs])

  const handleClear = () => {
    setInputValue('')
    onChange('')
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-400"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label={t('清除搜索')}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
