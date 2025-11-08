import nodeFetch from 'node-fetch'

/**
 * https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html#//apple_ref/doc/uid/TP40017632-CH5-SW1
 */
const BASE_URL = 'https://itunes.apple.com/lookup'

export function getUrl(appIds: Array<string | number>, region: Region) {
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

export default async function getAppInfo(
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
