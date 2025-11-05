import { writeFileSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const logFilePath = resolve(__dirname, '../storage/log.json')

export function readLogInfo(): LogInfo[] {
  const defaultRegionDiscountInfo: LogInfo[] = []

  if (!existsSync(logFilePath)) return defaultRegionDiscountInfo

  try {
    const data = JSON.parse(readFileSync(logFilePath, 'utf-8'))

    return data
  } catch {
    return defaultRegionDiscountInfo
  }
}

function saveRegionDiscountInfo(regionDiscountInfo: LogInfo[]) {
  writeFileSync(
    logFilePath,
    JSON.stringify(regionDiscountInfo, null, 2),
    'utf-8',
  )
}

export default function getLastLogInfo(props: {
  timestamp: number
  regionAppInfo: RegionAppInfo
}): LogInfo[] {
  const { timestamp, regionAppInfo } = props

  const logInfo: LogInfo = {
    timestamp,
    regionAppInfo: Object.entries(regionAppInfo).reduce(
      (res, [region, discountInfo]) => {
        const appInfo = discountInfo
          .reduce((appInfoRes, appInfo) => {
            const { trackId, trackName, inAppPurchasesTimes } = appInfo

            if (inAppPurchasesTimes > 1) {
              appInfoRes.push({
                trackId,
                trackName,
                inAppPurchasesTimes,
              })
            }

            return appInfoRes
          }, [])
          .sort((a, b) => b.inAppPurchasesTimes - a.inAppPurchasesTimes)

        res[region] = appInfo
        return res
      },
      {} as LogInfo['regionAppInfo'],
    ),
  }
  const existingInfo = readLogInfo()

  const merged = [logInfo, ...(existingInfo || [])]

  saveRegionDiscountInfo(merged)

  return merged
}
