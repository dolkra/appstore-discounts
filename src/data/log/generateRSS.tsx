import dayjs from 'dayjs'
import { Feed } from 'feed'
import { homepage } from '../../../package.json'
import { getRegionNameMap, regions, regionTimezoneMap } from 'appinfo.config'
import React, { render } from 'jsx-to-md'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { getAppStoreUrl } from '../utils'

export interface generateRSSProps {
  timestamp: number
  logInfo: LogInfo[]
}

export default function generateRSS(props: generateRSSProps) {
  const { timestamp, logInfo } = props

  const feed = new Feed({
    title: `日志信息`,
    id: `${homepage}/rss/log.xml`,
    copyright: 'Copyright (c) 2024-present Eyelly Wu',
    updated: new Date(timestamp),
    author: {
      name: 'Eyelly wu',
      email: 'eyelly.wu@gmail.com',
      link: 'https://github.com/eyelly-wu',
    },
  })

  logInfo.forEach((logInfoItem) => {
    const { timestamp, regionAppInfo } = logInfoItem
    const regionNameMap = getRegionNameMap()

    feed.addItem({
      title: `日志信息 - ${dayjs(timestamp)
        .tz(regionTimezoneMap.cn)
        .format('YYYY-MM-DD HH:mm:ss')}`,
      id: `日志信息 - ${timestamp}`,
      link: homepage,
      date: new Date(timestamp),
      content: render(
        <>
          <h1>各领域内购信息获取排行</h1>
          {regions.map((region) => {
            const regionName = regionNameMap[region]
            const appInfos = regionAppInfo[region]

            return (
              <>
                <h2>
                  {regionName}（{region}）
                </h2>
                <table>
                  <thead>
                    <tr>
                      <th>{t('名次')}</th>
                      <th>{t('App ID')}</th>
                      <th>{t('名称')}</th>
                      <th>{t('次数')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appInfos.map((appInfo, index) => {
                      const { trackId, trackName, inAppPurchasesTimes } =
                        appInfo

                      return (
                        <tr>
                          <td>
                            <b>{index + 1}</b>
                          </td>
                          <td>{trackId}</td>
                          <td>
                            <a href={getAppStoreUrl(region, trackId)}>
                              {trackName}
                            </a>
                          </td>
                          <td>
                            <b>{inAppPurchasesTimes}</b>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )
          })}
        </>,
      ),
    })
  })

  const filepath = resolve(__dirname, '../../../rss', `log.xml`)
  writeFileSync(filepath, feed.atom1(), 'utf-8')
}
