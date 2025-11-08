import chalk from 'chalk'
import parseInAppPurchases from '../parseInAppPurchases'
import browserManager from './browserManager'
import { GetInAppPurchasesProps, GetInAppPurchasesResult } from '../types'
import { IN_APP_PURCHASE_MAX_TIMES } from '../constants'

export default async function getInAppPurchases(
  props: GetInAppPurchasesProps,
): Promise<GetInAppPurchasesResult> {
  const { appInfo, region, log, times = 1 } = props
  console.log(log + `【x${times}】`)
  const { trackViewUrl } = appInfo
  let inAppPurchasesRes: AppInfo['inAppPurchases'] = {}
  const url = `${trackViewUrl}${
    trackViewUrl.includes('?') ? '&' : '?'
  }timestamp=${Date.now()}`

  function retry(): GetInAppPurchasesResult | Promise<GetInAppPurchasesResult> {
    if (times >= IN_APP_PURCHASE_MAX_TIMES) {
      console.log(chalk.red(log + ' failed'))
      return {
        inAppPurchases: inAppPurchasesRes,
        times,
        failed: true,
      }
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getInAppPurchases({ appInfo, region, log, times: times + 1 }))
      }, 1000)
    })
  }

  try {
    const page = await browserManager.getPage()
    let hasReleasePage = false

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 })
      const tempRes = await page.content()

      const { inAppPurchases, needRetry } = parseInAppPurchases({
        appInfo,
        region,
        htmlContent: tempRes,
        log,
        times,
      })

      inAppPurchasesRes = inAppPurchases

      if (needRetry) {
        await browserManager.releasePage(page)
        hasReleasePage = true
        return retry()
      }
    } finally {
      if (!hasReleasePage) {
        await browserManager.releasePage(page)
      }
    }
  } catch (error) {
    console.error(`${log} getInAppPurchases request error【x${times}】:`, error)
    return retry()
  }

  return {
    inAppPurchases: inAppPurchasesRes,
    times,
  }
}
