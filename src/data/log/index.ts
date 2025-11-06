import storageLogInfo from './storageLogInfo'
import generateRSS from './generateRSS'
export default function updateLog(props: Parameters<typeof storageLogInfo>[0]) {
  const { timestamp, regionAppInfo, duration } = props

  const logInfo = storageLogInfo({
    timestamp,
    regionAppInfo,
    duration,
  })

  generateRSS({
    timestamp,
    logInfo,
  })
}
