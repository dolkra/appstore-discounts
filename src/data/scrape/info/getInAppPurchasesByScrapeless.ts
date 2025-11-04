import { Scrapeless } from '@scrapeless-ai/sdk'
import chalk from 'chalk'
import parseInAppPurchases from './parseInAppPurchases'

export const SCRAPELESS_TOKEN = process.env.SCRAPELESS_TOKEN

const client = new Scrapeless({
  apiKey: SCRAPELESS_TOKEN || 'empty',
})

const IN_APP_PURCHASE_MAX_TIMES = 50

export default async function getInAppPurchasesByScrapeless(
  appInfo: RequestAppInfo,
  region: Region,
  log: string,
  times = 1,
): Promise<AppInfo['inAppPurchases']> {
  console.log(log)
  const { trackViewUrl } = appInfo
  let inAppPurchasesRes: AppInfo['inAppPurchases'] = {}
  const url = `${trackViewUrl}${
    trackViewUrl.includes('?') ? '&' : '?'
  }timestamp=${Date.now()}`

  function retry() {
    if (times > IN_APP_PURCHASE_MAX_TIMES) {
      console.log(chalk.red(log))
      return inAppPurchasesRes
    }
    return new Promise<AppInfo['inAppPurchases']>((resolve) => {
      setTimeout(() => {
        resolve(getInAppPurchasesByScrapeless(appInfo, region, log, times + 1))
      }, 1000)
    })
  }

  try {
    const tempRes = await client.universal.scrape({
      actor: 'unlocker.webunlocker',
      input: {
        url,
        redirect: true, // 改为 true 允许重定向
        method: 'GET', // Apple Store API 应该使用 GET 请求
        header: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      },
    })

    const {
      inAppPurchases,
      isPriceNotEqual,
      inAppPurchasesError,
      isPriceEmpty,
    } = parseInAppPurchases({
      appInfo,
      region,
      htmlContent: tempRes,
      log,
    })

    inAppPurchasesRes = inAppPurchases

    if ((isPriceNotEqual && isPriceEmpty) || inAppPurchasesError) {
      return retry()
    }
  } catch (error) {
    console.error(`${log} getInAppPurchases request error:`, error)
    return retry()
  }

  return inAppPurchasesRes
}
