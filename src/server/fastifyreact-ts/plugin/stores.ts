import type { SourceDescription } from 'rollup'

// Define a type for the route context for better type safety
interface RouteContext {
  state: Record<string, any>;
  actions?: Record<string, Record<string, (...args: any[]) => any>>;
}

// Define the structure of the proxy object
interface StoreProxy {
  key: string;
  wrappers: Record<string, (...args: any[]) => any>;
  context: RouteContext | null;
}

export function generateStores(keys: string[]): SourceDescription {
  let code = `
import { useRouteContext } from '@fastify/react/client'

function storeGetter (proxy, prop) {
  if (!proxy.context) {
    proxy.context = useRouteContext()
  }
  if (prop === 'state') {
    return proxy.context.state[proxy.key]
  }
  let method
  if (method = proxy.context.actions?.[proxy.key]?.[prop]) {
    if (!proxy.wrappers[prop]) {
      proxy.wrappers[prop] = (...args) => {
        return method(proxy.context.state, ...args)
      }
    }
    return proxy.wrappers[prop]
  }
}
`
  for (const key of keys) {
    code += `
export const ${key} = new Proxy({
  key: '${key}',
  wrappers: {},
  context: null,
}, {
  get: storeGetter
})
`
  }
  return {
    code,
    map: null
  }
}