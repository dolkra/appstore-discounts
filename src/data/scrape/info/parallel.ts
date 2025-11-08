import { chunk } from 'lodash'
import pLimit from 'p-limit'
import { start, end } from '../../timer'
import getAppInfo from './getAppInfo'
import {
  getByFetch,
  getByPlayWright,
  GetInAppPurchasesResult,
  GetInAppPurchasesProps,
  playWrightBrowserManager,
} from './getInAppPurchases'

const scrapeTypeImplMap: Record<
  InAppPurchasesScrapeType,
  (
    props: GetInAppPurchasesProps,
  ) => GetInAppPurchasesResult | Promise<GetInAppPurchasesResult>
> = {
  fetch: getByFetch,
  playwright: getByPlayWright,
}

export default async function getRegionAppInfo(
  appIds: Array<string | number>,
  regions: Region[],
  limitCount: number,
  scrapeType: InAppPurchasesScrapeType,
) {
  const label = `parallel getRegionAppInfo(${limitCount})`
  start(label)
  const res: RegionAppInfo = {}
  const limit = pLimit(limitCount)
  const chunkAppIds = chunk(appIds, 200)

  try {
    if (scrapeType === 'playwright') {
      await playWrightBrowserManager.initialize()
    }
    const scrapeImpl = scrapeTypeImplMap[scrapeType]

    for (let i = 0; i < regions.length; i++) {
      const region = regions[i]
      const label = `【${i + 1}/${regions.length}】（${region}）`
      const appInfos = (
        await Promise.all(
          chunkAppIds.map((appIds, i) => {
            const label2 = `${label}【${i + 1}/${chunkAppIds.length}】`
            return getAppInfo(appIds, region, `${label2}getAppInfo`)
          }),
        )
      ).reduce((res, appInfos) => {
        res.push(...appInfos)
        return res
      }, [])

      if (appInfos.length > 0) {
        const inAppPurchasesArr: GetInAppPurchasesResult[] = await Promise.all(
          appInfos.map((appInfo, j) =>
            limit(() =>
              scrapeImpl({
                appInfo,
                region,
                log: `${label}【${j + 1}/${appInfos.length}】【${
                  appInfo.trackName
                }】【by ${scrapeType}】`,
              }),
            ),
          ),
        )
        res[region] = appInfos.reduce((res, appInfo, j) => {
          const { inAppPurchases, times, failed } = inAppPurchasesArr[j]
          res.push({
            ...appInfo,
            inAppPurchases,
            inAppPurchasesTimes: times,
            inAppPurchasesFailed: failed,
          })
          return res
        }, [] as AppInfo[])
      }
    }
  } finally {
    await playWrightBrowserManager.close()
  }

  end(label)
  return res
}
