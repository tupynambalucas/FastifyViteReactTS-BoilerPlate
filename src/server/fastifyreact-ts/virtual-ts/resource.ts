const clientFetchMap = new Map<string, any>()
const clientResourceMap = new Map<string, any>()

export function waitResource(
  path: string,
  id: string,
  promise?: () => Promise<any>,
  resourceMap: Map<string, any> = clientResourceMap,
) {
  const resourceId = `${path}:${id}`
  const loaderStatus = resourceMap.get(resourceId)
  if (loaderStatus) {
    if (loaderStatus.error) {
      throw loaderStatus.error
    }
    if (loaderStatus.suspended) {
      throw loaderStatus.promise
    }
    resourceMap.delete(resourceId)

    return loaderStatus.result
  }
  const loader: {
    suspended: boolean
    error: any
    result: any
    promise: Promise<any> | null // CORRECTED
  } = {
    suspended: true,
    error: null,
    result: null,
    promise: null,
  }

  if (promise) {
    loader.promise = promise()
      .then((result) => {
        loader.result = result
      })
      .catch((loaderError) => {
        loader.error = loaderError
      })
      .finally(() => {
        loader.suspended = false
      })

    resourceMap.set(resourceId, loader)
  } else {
    throw new Error(
      'waitResource called without a promise to initialize the loader.',
    )
  }

  return waitResource(path, id, undefined, resourceMap)
}

export function waitFetch<T = any>(
  path: string,
  options: RequestInit = {},
  fetchMap: Map<string, any> = clientFetchMap,
): T {
  const loaderStatus = fetchMap.get(path)
  if (loaderStatus) {
    if (loaderStatus.error || loaderStatus.data?.statusCode === 500) {
      if (loaderStatus.data?.statusCode === 500) {
        throw new Error(loaderStatus.data.message)
      }
      throw loaderStatus.error
    }
    if (loaderStatus.suspended) {
      throw loaderStatus.promise
    }
    fetchMap.delete(path)

    return loaderStatus.data as T
  }
  const loader: {
    suspended: boolean
    error: any
    data: any
    promise: Promise<any> | null // CORRECTED
  } = {
    suspended: true,
    error: null,
    data: null,
    promise: null,
  }
  loader.promise = fetch(path, options)
    .then((response) => response.json())
    .then((loaderData) => {
      loader.data = loaderData
    })
    .catch((loaderError) => {
      loader.error = loaderError
    })
    .finally(() => {
      loader.suspended = false
    })

  fetchMap.set(path, loader)

  return waitFetch(path, options, fetchMap) as T
}