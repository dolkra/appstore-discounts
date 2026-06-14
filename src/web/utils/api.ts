/**
 * iTunes API 工具模块（客户端数据层）
 *
 * 提供与 iTunes Lookup API 交互的能力，用于获取应用元信息（名称、图标、评分等）。
 *
 * 网络策略 —— 浏览器直连 iTunes：
 *   iTunes Search API 响应已带 `Access-Control-Allow-Origin: *`，浏览器可直接调用，
 *   无需经过 Cloudflare Worker 中转（CF 出口 IP 已被 iTunes 反爬封锁）。
 *   这样请求出口分散到每个用户的家庭/办公网 IP，不会触发集中性风控。
 *
 * 核心设计——双层缓存策略：
 *   1. 内存缓存（Map）：运行时最快访问，页面刷新后失效
 *   2. localStorage 缓存：持久化存储，跨页面刷新保留，TTL 1 小时
 *
 * 缓存键格式：{region}_{trackId}，例如 "cn_6502453075"
 *
 * 提供两个查询接口：
 *   - lookupApp(trackId, region)  → 查询单个应用
 *   - lookupApps(trackIds, region) → 批量查询，自动分批（每批 50 个）
 */
import type { iTunesLookupResponse, CachedAppInfo, Region } from '@/types'

/** iTunes 官方 Lookup 接口（支持 CORS，可在浏览器直接 fetch） */
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup'
/** 缓存过期时间：1 小时 */
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/** 第一层缓存：内存 Map，页面刷新后清空 */
const appInfoCache = new Map<string, CachedAppInfo>()

/** 生成缓存键 */
function getCacheKey(region: Region, trackId: number): string {
  return `${region}_${trackId}`
}

/**
 * 从缓存中获取应用信息（优先内存，其次 localStorage）
 * @returns 缓存命中且未过期时返回 CachedAppInfo，否则返回 null
 */
function getCachedAppInfo(
  region: Region,
  trackId: number,
): CachedAppInfo | null {
  const key = getCacheKey(region, trackId)

  // 第一优先：内存缓存
  const cached = appInfoCache.get(key)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached
  }
  // 第二优先：localStorage（作为降级方案）
  try {
    const stored = localStorage.getItem(`app_info_${key}`)
    if (stored) {
      const parsed: CachedAppInfo = JSON.parse(stored)
      if (Date.now() - parsed.cachedAt < CACHE_TTL) {
        appInfoCache.set(key, parsed) // 回填内存缓存
        return parsed
      }
    }
  } catch {
    // localStorage 可能被禁用或满，忽略错误
  }
  return null
}

/**
 * 写入缓存（同时写入内存和 localStorage）
 */
function setCachedAppInfo(
  region: Region,
  trackId: number,
  info: CachedAppInfo,
): void {
  const key = getCacheKey(region, trackId)
  appInfoCache.set(key, info)
  try {
    localStorage.setItem(`app_info_${key}`, JSON.stringify(info))
  } catch {
    // localStorage 满或被禁用，忽略
  }
}

/**
 * 查询单个应用信息
 * 先查缓存，缓存未命中时调用 iTunes Lookup API 获取并缓存结果
 *
 * @param trackId - App Store 应用 ID
 * @param region - 地区代码
 * @returns 应用信息对象，未找到时返回 null
 */
export async function lookupApp(
  trackId: number,
  region: Region,
): Promise<CachedAppInfo | null> {
  const cached = getCachedAppInfo(region, trackId)
  if (cached) return cached

  const country = region.toUpperCase()
  const res = await fetch(
    `${ITUNES_LOOKUP_URL}?id=${trackId}&country=${country}`,
  )
  const data: iTunesLookupResponse = await res.json()

  if (data.resultCount === 0) return null

  const app = data.results[0]
  const cachedInfo: CachedAppInfo = {
    trackId: app.trackId,
    trackName: app.trackName,
    artworkUrl100: app.artworkUrl100,
    artworkUrl512: app.artworkUrl512,
    averageUserRating: app.averageUserRating,
    userRatingCount: app.userRatingCount,
    description: app.description,
    supportedDevices: app.supportedDevices,
    genres: app.genres,
    primaryGenreName: app.primaryGenreName,
    artistName: app.artistName,
    artistViewUrl: app.artistViewUrl,
    contentAdvisoryRating: app.contentAdvisoryRating,
    version: app.version,
    currentVersionReleaseDate: app.currentVersionReleaseDate,
    fileSizeBytes: app.fileSizeBytes,
    minimumOsVersion: app.minimumOsVersion,
    languageCodesISO2A: app.languageCodesISO2A,
    releaseNotes: app.releaseNotes,
    trackViewUrl: app.trackViewUrl,
    kind: app.kind,
    screenshotUrls: app.screenshotUrls,
    ipadScreenshotUrls: app.ipadScreenshotUrls,
    appletvScreenshotUrls: app.appletvScreenshotUrls,
    cachedAt: Date.now(),
  }

  setCachedAppInfo(region, trackId, cachedInfo)
  return cachedInfo
}

/**
 * 批量查询应用信息
 *
 * 优化策略：
 *   1. 先从缓存中批量读取已有数据
 *   2. 仅对缓存未命中的 ID 调用 iTunes API
 *   3. 使用批量查询接口（itunes.apple.com/lookup?id=1,2,3）减少请求数
 *   4. 按 BATCH_SIZE 分批发送，避免单次请求 ID 过多
 *
 * @param trackIds - 需要查询的应用 ID 列表
 * @param region - 地区代码
 * @returns Map<trackId, CachedAppInfo> 包含所有查到的应用信息
 */
export async function lookupApps(
  trackIds: number[],
  region: Region,
): Promise<Map<number, CachedAppInfo>> {
  const result = new Map<number, CachedAppInfo>()
  const uncachedIds: number[] = []

  // 第一步：从缓存中批量读取已有数据

  // Check cache first
  for (const id of trackIds) {
    const cached = getCachedAppInfo(region, id)
    if (cached) {
      result.set(id, cached)
    } else {
      uncachedIds.push(id)
    }
  }

  // Fetch uncached apps in batches
  // 浏览器直连 iTunes，单批 50 个 ID 在 URL 长度和 iTunes 服务端都安全。
  const BATCH_SIZE = 50
  for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
    const batch = uncachedIds.slice(i, i + BATCH_SIZE)
    const country = region.toUpperCase()
    const ids = batch.join(',')

    try {
      const res = await fetch(
        `${ITUNES_LOOKUP_URL}?id=${ids}&country=${country}`,
      )
      const data: iTunesLookupResponse = await res.json()

      for (const app of data.results) {
        const cachedInfo: CachedAppInfo = {
          trackId: app.trackId,
          trackName: app.trackName,
          artworkUrl100: app.artworkUrl100,
          artworkUrl512: app.artworkUrl512,
          averageUserRating: app.averageUserRating,
          userRatingCount: app.userRatingCount,
          description: app.description,
          supportedDevices: app.supportedDevices,
          genres: app.genres,
          primaryGenreName: app.primaryGenreName,
          artistName: app.artistName,
          artistViewUrl: app.artistViewUrl,
          contentAdvisoryRating: app.contentAdvisoryRating,
          version: app.version,
          currentVersionReleaseDate: app.currentVersionReleaseDate,
          fileSizeBytes: app.fileSizeBytes,
          minimumOsVersion: app.minimumOsVersion,
          languageCodesISO2A: app.languageCodesISO2A,
          releaseNotes: app.releaseNotes,
          trackViewUrl: app.trackViewUrl,
          kind: app.kind,
          screenshotUrls: app.screenshotUrls,
          ipadScreenshotUrls: app.ipadScreenshotUrls,
          appletvScreenshotUrls: app.appletvScreenshotUrls,
          cachedAt: Date.now(),
        }
        setCachedAppInfo(region, app.trackId, cachedInfo)
        result.set(app.trackId, cachedInfo)
      }
    } catch (error) {
      console.error('Failed to fetch app info batch:', error)
    }
  }

  return result
}
