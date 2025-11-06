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
    const { timestamp, regionAppInfo, duration, regionAppCount } = logInfoItem
    const regionNameMap = getRegionNameMap()

    feed.addItem({
      title: `日志信息 - ${dayjs(timestamp)
        .tz(regionTimezoneMap.cn)
        .format('YYYY-MM-DD HH:mm:ss')}`,
      id: `日志信息 - ${timestamp}`,
      link: homepage,
      date: new Date(timestamp),
      description: `共耗时：${duration}`,
      content: render(
        <>
          <h1>汇总信息</h1>
          <p>总耗时：{duration}</p>
          <h2>统计信息</h2>
          <table>
            <thead>
              <tr>
                <th>{t('区域')}</th>
                <th>{t('应用总数')}</th>
                <th>{t('重新获取应用数')}</th>
                <th>{t('重试总次数')}</th>
                <th>{t('获取失败数')}</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region) => {
                const regionName = regionNameMap[region]
                const appCount = regionAppCount[region] || 0
                const appInfos = regionAppInfo[region] || []
                const allRetryTimes = appInfos.reduce((res, appInfo) => {
                  const { inAppPurchasesTimes = 1 } = appInfo
                  return res + inAppPurchasesTimes - 1
                }, 0)
                const countPercentage =
                  appCount === 0
                    ? '-%'
                    : Math.round((appInfos.length / appCount) * 100) + '%'
                const allFailed = appInfos.filter(
                  (item) => item.inAppPurchasesFailed,
                ).length
                const failedPercentage =
                  appInfos.length === 0
                    ? '-%'
                    : Math.round((allFailed / appInfos.length) * 100) + '%'

                return (
                  <tr>
                    <td>
                      {regionName}（{region.toUpperCase()}）
                    </td>
                    <td>{appCount}</td>
                    <td>
                      {appInfos.length || '0'}（{countPercentage}）
                    </td>
                    <td>
                      <b>{allRetryTimes || '0'}</b>
                    </td>
                    <td>
                      <b>
                        {allFailed || '0'}（{failedPercentage}）
                      </b>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <h1>各领域内购信息获取排行</h1>
          {regions.map((region) => {
            const regionName = regionNameMap[region]
            const appInfos = regionAppInfo[region] || []

            return (
              <>
                <h2>
                  {regionName}（{region.toUpperCase()}）
                </h2>
                <table>
                  <thead>
                    <tr>
                      <th>{t('名次')}</th>
                      <th>{t('应用')}</th>
                      <th>{t('次数')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appInfos.map((appInfo, index) => {
                      const {
                        trackId,
                        trackName,
                        inAppPurchasesTimes,
                        inAppPurchasesFailed,
                      } = appInfo

                      return (
                        <tr>
                          <td>
                            <b>{index + 1}</b>
                          </td>
                          <td>
                            <ul>
                              <li>{trackId}</li>
                              <li>
                                <a href={getAppStoreUrl(region, trackId)}>
                                  {trackName}
                                </a>
                              </li>
                            </ul>
                          </td>
                          <td>
                            <b>
                              {inAppPurchasesTimes}
                              {inAppPurchasesFailed ? '&nbsp;&nbsp;❌' : ''}
                            </b>
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
