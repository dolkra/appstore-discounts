import dayjs from 'dayjs'
import utcPlugin from 'dayjs/plugin/utc'
import timezonePlugin from 'dayjs/plugin/timezone'
import { regionTimezoneMap, regionLanguageCodeMap } from 'appinfo.config'

dayjs.extend(utcPlugin)
dayjs.extend(timezonePlugin)

/** 配套网页站点的根 URL，用于生成应用详情页等深链 */
export const WEB_SITE_BASE_URL = 'https://appstore-discounts.eyelly.me'

export function getRegionDate(region: Region, timestamp: number) {
  const timezone = regionTimezoneMap[region]
  return dayjs(timestamp).tz(timezone).format('YYYY/MM/DD')
}

/**
 * 生成应用详情页的 URL
 *
 * 语言遵循 appinfo.config.ts 中的 regionLanguageCodeMap：
 *   - cn/hk/mo/tw → zh-CN
 *   - us/tr/pt    → en
 *
 * @example getAppUrl('cn', 1587301632)
 *   → https://appstore-discounts.eyelly.me/cn/1587301632?lang=zh-CN
 */
export function getAppUrl(region: Region, id: string | number) {
  const lang = regionLanguageCodeMap[region]
  return `${WEB_SITE_BASE_URL}/${region}/${id}?lang=${lang}`
}

/**
 * 生成应用列表页的 URL
 *
 * @example getAppsUrl('cn')
 *   → https://appstore-discounts.eyelly.me/cn/apps?lang=zh-CN
 */
export function getAppsUrl(region: Region) {
  const lang = regionLanguageCodeMap[region]
  return `${WEB_SITE_BASE_URL}/${region}/apps?lang=${lang}`
}
