import dayjs from 'dayjs'
import parallel from './parallel'
import { regionTimezoneMap } from 'appinfo.config'

export default async function (
  appIds: Array<string | number>,
  regions: Region[],
) {
  const hour = dayjs().tz(regionTimezoneMap.cn).hour()
  let limitCount = 10
  let scrapeType: InAppPurchasesScrapeType = 'fetch'

  if (hour >= 4 && hour < 6) {
    limitCount = 4
  } else if (hour >= 6 && hour < 8) {
    limitCount = 6
  } else if (hour >= 8 && hour < 10) {
    limitCount = 8
  } else if (hour >= 12 && hour < 14) {
    limitCount = 12
  }

  if (hour % 4 === 0) {
    scrapeType = 'playwright'
  }

  const regionAppInfo = await parallel(appIds, regions, limitCount, scrapeType)

  return {
    regionAppInfo,
    limitCount,
    scrapeType,
  }
}
