import nodeFetch from 'node-fetch'
import chalk from 'chalk'
import parseInAppPurchases from './parseInAppPurchases'

const IN_APP_PURCHASE_MAX_TIMES = 50

/**
 * https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html#//apple_ref/doc/uid/TP40017632-CH5-SW1
 */
const BASE_URL = 'https://itunes.apple.com/lookup'

function getUrl(appIds: Array<string | number>, region: Region) {
  const url = new URL(BASE_URL)

  const search = new URLSearchParams({
    id: appIds.join(','),
    country: region,
    entity: 'software',
    limit: `${appIds.length}`,
    timestamp: Date.now() + '',
  }).toString()
  url.search = search

  return url
}

export type GetInAppPurchasesResult = {
  inAppPurchases: AppInfo['inAppPurchases']
  times: number
}

export async function getInAppPurchases(
  appInfo: RequestAppInfo,
  region: Region,
  log: string,
  times = 1,
): Promise<GetInAppPurchasesResult> {
  console.log(log)
  const { trackViewUrl } = appInfo
  let inAppPurchasesRes: AppInfo['inAppPurchases'] = {}
  const url = `${trackViewUrl}${
    trackViewUrl.includes('?') ? '&' : '?'
  }timestamp=${Date.now()}`

  function retry() {
    if (times > IN_APP_PURCHASE_MAX_TIMES) {
      console.log(chalk.red(log))
      return {
        inAppPurchases: inAppPurchasesRes,
        times,
      }
    }
    return new Promise<GetInAppPurchasesResult>((resolve) => {
      setTimeout(() => {
        resolve(getInAppPurchases(appInfo, region, log, times + 1))
      }, 1000)
    })
  }

  try {
    const tempRes = (await nodeFetch(url, {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
    }).then((res) => res.text())) as string

    const { inAppPurchases, needRetry } = parseInAppPurchases({
      appInfo,
      region,
      htmlContent: tempRes,
      log,
      times,
    })

    inAppPurchasesRes = inAppPurchases

    if (needRetry) {
      return retry()
    }
  } catch (error) {
    console.error(`${log} getInAppPurchases request error:`, error)
    return retry()
  }

  return {
    inAppPurchases: inAppPurchasesRes,
    times,
  }
}

export async function getAppInfo(
  appIds: Array<string | number>,
  region: Region,
  log: string,
): Promise<RequestAppInfo[]> {
  let res: RequestAppInfo[] = []
  console.log(log)
  try {
    const tempRes = (await nodeFetch(getUrl(appIds, region), {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
    }).then((res) => res.json())) as ResponseResult

    const errorMessage = tempRes.errorMessage

    if (errorMessage) {
      throw errorMessage
    }

    res = (tempRes as ResponseResult).results
  } catch (error) {
    console.error('getAppInfo request error:', error)
    const errorMsg = typeof error === 'string' ? error : error?.toString?.()
    if (
      errorMsg.includes('SyntaxError: Unexpected token < in JSON at position 0')
    ) {
      res = await getAppInfo(appIds, region, log)
    }
  }

  return res
}
