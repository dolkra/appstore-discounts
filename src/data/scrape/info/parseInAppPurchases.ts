import { regionInAppPurchasesTextMap } from 'appinfo.config'
import { load } from 'cheerio'
import { isEmpty } from 'lodash'

export type ParseInAppPurchasesProps = {
  appInfo: RequestAppInfo
  region: Region
  htmlContent: string
  log: string
}

export default function parseInAppPurchases(props: ParseInAppPurchasesProps) {
  const { appInfo, htmlContent, region, log } = props

  const { formattedPrice, trackName } = appInfo

  const inAppPurchasesText = regionInAppPurchasesTextMap[region]

  const $ = load(htmlContent)

  const inAppPurchasesElement = $('#information').find(
    `dt:contains("${inAppPurchasesText}")`,
  )

  const inAppPurchases: AppInfo['inAppPurchases'] = {}
  let isPriceNotEqual = false
  let inAppPurchasesError = false
  let isPriceEmpty = false

  const getReturn = () => {
    const res = {
      inAppPurchases,
      isPriceNotEqual,
      inAppPurchasesError,
      isPriceEmpty,
    }

    return res
  }

  const pElement = $('p.attributes')

  const [pagePrice, pageInAppPurchasesText] = (
    pElement?.text()?.trim()?.split(' · ') || []
  ).map((item) => item.trim())

  if (formattedPrice !== pagePrice) {
    isPriceNotEqual = true
    console.error(
      `${log}【${trackName}】appInfo price(${formattedPrice}) !== pageInfo price(${pagePrice})`,
    )
    if (isEmpty(pagePrice)) {
      isPriceEmpty = true
    }
    return getReturn()
  }

  inAppPurchasesElement
    ?.parent?.()
    ?.find?.('div.text-pair')
    ?.each((divIndex, div) => {
      let name = ''
      let price = ''
      $(div)
        .find('span')
        .each((spanIndex, span) => {
          const element = $(span)
          if (spanIndex === 0) {
            name = element.text().trim()
          } else if (spanIndex === 1) {
            price = element.text().trim()
          }

          if (name && price) {
            inAppPurchases[name] = price
          }
        })
    })

  if (inAppPurchasesElement?.html() && isEmpty(inAppPurchases)) {
    inAppPurchasesError = true
    console.error(
      `${log}【${trackName}】is In-App purchase，but can't get relate info`,
    )
  }

  return getReturn()
}
