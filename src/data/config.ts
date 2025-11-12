import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { isEmpty } from 'lodash'
import { start, end } from './timer'
import { $schema, appConfig as oldAppConfig } from 'apps.json'

const contentEncoding = 'utf-8'
const filepath = resolve(__dirname, '../../apps.json')

function updateImpl(appConfig: AppConfig[]) {
  writeFileSync(
    filepath,
    JSON.stringify(
      {
        $schema,
        appConfig,
      },
      null,
      2,
    ),
    { encoding: contentEncoding },
  )
}

export default function updateAppInfoConfig(
  regionAppTopInfo: Partial<RegionAppTopInfo>,
) {
  start('updateAppInfoConfig')

  const ids = oldAppConfig.map((item) => `${item.id}`)

  const idNameMap: Record<string, Partial<Record<Region, string>>> = {}

  Object.entries(regionAppTopInfo).forEach(([region, appTopInfo]) => {
    appTopInfo.forEach(({ id, name }) => {
      if (ids.includes(id)) return
      const item = idNameMap[id]

      if (item) {
        item[region] = name
      } else {
        idNameMap[id] = {
          [region]: name,
        }
      }
    })
  })

  if (isEmpty(idNameMap)) {
    end('updateAppInfoConfig')
    return oldAppConfig
  }

  const appConfig: AppConfig[] = Object.entries(idNameMap).reduce(
    (res, [id, regionNameMap]) => {
      const appConfig: AppConfig = {
        id: parseInt(id),
        name: regionNameMap,
        addType: 'auto',
      }
      res.push(appConfig)

      return res
    },
    [],
  )

  const newAppConfig = [...appConfig, ...oldAppConfig]

  updateImpl(newAppConfig)

  end('updateAppInfoConfig')

  return newAppConfig
}
