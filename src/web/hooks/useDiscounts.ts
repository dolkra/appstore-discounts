/**
 * 折扣数据获取 Hook（核心数据层）
 *
 * 负责从后端 API 获取折扣列表数据，并结合 iTunes API 补全应用元信息（图标、名称等）。
 * 支持分页加载、排序切换、地区切换。
 *
 * 数据流：
 *   1. region/sortOrder 变化 → 清空已有数据，请求第一页
 *   2. loadMore() → 请求下一页并追加到列表
 *   3. 获取折扣数据后，批量调用 lookupApps 获取应用元信息（带缓存）
 *
 * 依赖：
 *   - GET /api/discounts/{region}?page=X&size=40&sort=desc|asc&q=keyword → 分页折扣数据
 *   - utils/api.lookupApps() → iTunes 应用信息（带内存+localStorage 双层缓存）
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import type { DiscountListItem, CachedAppInfo, Region } from '@/types'
import { lookupApps } from '@/utils/api'

/** 每页加载的折扣条目数量 */
const PAGE_SIZE = 40

/**
 * 对折扣列表按「应用 ID + 折扣信息」去重
 * 同一应用可能在不同日期产生不同的折扣记录，只有当 trackId 相同且折扣内容完全一致时才去重
 * 保留 API 返回的顺序（排序由后端接口负责）
 */
function dedupItems(items: DiscountListItem[]): DiscountListItem[] {
  const seen = new Set<string>()
  const result: DiscountListItem[] = []
  for (const item of items) {
    // 生成唯一键：trackId + 排序后的折扣详情
    const discountKey = item.discounts
      .map((d) => `${d.type}:${d.name}:${d.from}:${d.to}:${d.range}`)
      .sort()
      .join('|')
    const key = `${item.trackId}_${discountKey}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }
  return result
}

/** 后端 API 返回的折扣数据结构 */
interface DiscountResponse {
  items: DiscountListItem[]
  total: number
  page: number
  size: number
  hasMore: boolean
}

/**
 * 折扣数据获取 Hook
 * @param region - App Store 地区代码
 * @param sortOrder - 排序顺序：'desc'（最新优先）或 'asc'（最早优先）
 * @param query - 搜索关键词，传递给后端 API 进行服务端过滤
 */
export function useDiscounts(
  region: Region,
  sortOrder: 'desc' | 'asc' = 'desc',
  query = '',
) {
  /** 折扣列表数据 */
  const [items, setItems] = useState<DiscountListItem[]>([])
  /** 应用元信息缓存（trackId → AppInfo），用于在卡片中显示图标、名称等 */
  const [appInfos, setAppInfos] = useState<Map<number, CachedAppInfo>>(
    new Map(),
  )
  /** 查询失败的应用 ID 集合（iTunes API 未返回结果，可能已下架） */
  const [failedAppIds, setFailedAppIds] = useState<Set<number>>(new Set())
  /** 是否还有更多数据可加载 */
  const [hasMore, setHasMore] = useState(true)
  /** 是否正在加载中 */
  const [loading, setLoading] = useState(false)
  /** 加载错误信息，null 表示无错误 */
  const [error, setError] = useState<string | null>(null)
  /** 当前已加载的页码（用于 loadMore 计算下一页） */
  const pageRef = useRef(0)
  /** 重试计数器，递增时触发重新加载 */
  const [retryCount, setRetryCount] = useState(0)
  /** 用 ref 追踪最新 query，避免 loadMore 的 useCallback 依赖频繁变化 */
  const queryRef = useRef(query)
  queryRef.current = query

  /**
   * 重试加载（递增 retryCount 触发 Effect 重新执行）
   */
  const retry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  /**
   * 核心 Effect：当 region 或 sortOrder 变化时，重置状态并请求第一页数据
   * 使用 AbortController 确保快速切换时取消过时请求
   */
  useEffect(() => {
    const controller = new AbortController()
    // 重置所有分页状态
    setItems([])
    setAppInfos(new Map())
    setFailedAppIds(new Set())
    setHasMore(true)
    pageRef.current = 0
    setLoading(true)
    setError(null)

    const q = query ? `&q=${encodeURIComponent(query)}` : ''
    fetch(
      `/api/discounts/${region}?page=1&size=${PAGE_SIZE}&sort=${sortOrder}${q}`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data: DiscountResponse) => {
        setItems(dedupItems(data.items))
        setHasMore(data.hasMore)
        pageRef.current = 1

        // 拿到折扣列表后，批量获取应用元信息（图标、名称、评分等）
        const uniqueIds = [...new Set(data.items.map((item) => item.trackId))]
        if (uniqueIds.length > 0) {
          lookupApps(uniqueIds, region).then((infos) => {
            setAppInfos((prev) => {
              const next = new Map(prev)
              for (const [id, info] of infos) {
                next.set(id, info)
              }
              return next
            })
            // 追踪查询失败的应用 ID（iTunes API 未返回结果）
            const failed = new Set<number>()
            for (const id of uniqueIds) {
              if (!infos.has(id)) failed.add(id)
            }
            if (failed.size > 0) {
              setFailedAppIds((prev) => new Set([...prev, ...failed]))
            }
          })
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to load discounts:', err)
          setError('LOAD_FAILED')
        }
      })
      .finally(() => setLoading(false))

    // 组件卸载或 region/sortOrder 变化时取消进行中的请求
    return () => controller.abort()
  }, [region, sortOrder, retryCount, query])

  /**
   * 加载下一页数据
   * 从 pageRef 读取当前页码，请求 page+1 并追加到已有列表
   * 使用 AbortController 防止快速切换地区时的竞态条件
   */
  const loadNextPage = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    const page = pageRef.current + 1
    const controller = new AbortController()

    try {
      const currentQuery = queryRef.current
      const q = currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : ''
      const res = await fetch(
        `/api/discounts/${region}?page=${page}&size=${PAGE_SIZE}&sort=${sortOrder}${q}`,
        { signal: controller.signal },
      )
      const data: DiscountResponse = await res.json()

      setItems((prev) => dedupItems([...prev, ...data.items]))
      setHasMore(data.hasMore)
      pageRef.current = page

      if (data.items.length > 0) {
        const uniqueIds = [...new Set(data.items.map((item) => item.trackId))]
        const infos = await lookupApps(uniqueIds, region)
        setAppInfos((prev) => {
          const next = new Map(prev)
          for (const [id, info] of infos) {
            next.set(id, info)
          }
          return next
        })
        // 追踪查询失败的应用 ID
        const failed = new Set<number>()
        for (const id of uniqueIds) {
          if (!infos.has(id)) failed.add(id)
        }
        if (failed.size > 0) {
          setFailedAppIds((prev) => new Set([...prev, ...failed]))
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to load discounts:', err)
        setError('LOAD_FAILED')
        setHasMore(false)
      }
    } finally {
      setLoading(false)
    }
  }, [region, loading, hasMore, sortOrder])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadNextPage()
    }
  }, [loading, hasMore, loadNextPage])

  return {
    items,
    appInfos,
    failedAppIds,
    loading,
    error,
    hasMore,
    loadMore,
    retry,
  }
}
