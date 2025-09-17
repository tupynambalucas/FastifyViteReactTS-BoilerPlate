import type { FastifyInstance, FastifyRequest, FastifyReply, RouteOptions } from 'fastify'
import type { ComponentType } from 'react'

import type { SharedRouteDefinition } from '../../types/shared.js'
import type RouteContext from './context.js'

// --- Interface & Type Definitions ---

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type RouteDef = SharedRouteDefinition
type AppRoute = Omit<RouteDef, 'component'> & {
  component: ComponentType<any>;
} & Partial<RouteOptions>;

interface JsonRoute {
  id: string
  path: string
  name: string
  layout: string
  getData: boolean
  getMeta: boolean
  onEnter: boolean
}

type RouteModuleInput = (() => Promise<Partial<AppRoute>>) | Partial<AppRoute>

// --- Module Augmentation for Fastify ---
declare module 'fastify' {
  interface FastifyInstance {
    serverURL: string
  }
  interface FastifyRequest {
    fetchMap: Map<unknown, unknown> | null | undefined
  }
}

// --- Class Definition ---
class Routes extends Array<AppRoute> {
  toJSON(): JsonRoute[] {
    return this.map((route) => {
      return {
        id: route.id,
        path: route.path,
        name: route.name,
        layout: route.layout,
        getData: !!route.getData,
        getMeta: !!route.getMeta,
        onEnter: !!route.onEnter,
      }
    })
  }
}

// --- Core Functions ---
export function prepareServer(server: FastifyInstance): void {
  let url: string
  server.decorate('serverURL', { getter: () => url })
  server.addHook('onListen', (done) => {
    const addressInfo = server.server.address()
    if (typeof addressInfo === 'string') {
      url = addressInfo
    } else if (addressInfo) {
      const { port, address, family } = addressInfo
      const protocol = (server as any).https ? 'https' : 'http'
      url =
        family === 'IPv6'
          ? `${protocol}://[${address}]:${port}`
          : `${protocol}://${address}:${port}`
    }
    done()
  })

  server.decorateRequest('fetchMap', null)
  server.addHook('onRequest', (req, _, done) => {
    req.fetchMap = new Map()
    done()
  })
  server.addHook('onResponse', (req, _, done) => {
    req.fetchMap = undefined
    done()
  })
}

export async function createRoutes(
  fromPromise: Promise<{ default: RouteDef[] | Record<string, RouteModuleInput> }>,
  { param } = { param: /\[([.\w]+\+?)\]/ },
): Promise<Routes> {
  const { default: from } = await fromPromise
  const promises: Promise<AppRoute>[] = []

  if (Array.isArray(from)) {
    for (const routeDef of from) {
      promises.push(
        getRouteModule(
          routeDef.path,
          routeDef.component as unknown as RouteModuleInput,
        ).then((routeModule) => {
          const { component: resolvedComponent, ...restOfRouteModule } = routeModule;

          if (!resolvedComponent) {
            throw new Error(`Failed to resolve component for route: ${routeDef.path}`);
          }

          const { component, ...restOfRouteDef } = routeDef;

          const finalRoute: AppRoute = {
            ...restOfRouteModule,
            ...restOfRouteDef,
            component: resolvedComponent,
          };

          finalRoute.layout =
            routeModule.layout ?? routeDef.layout ?? 'default';
          // console.log(finalRoute)
          return finalRoute;
        }),
      );
    }
  } else {
    const importPaths = Object.keys(from).sort((a, b) => (a > b ? -1 : 1))
    for (const path of importPaths) {
      promises.push(
        getRouteModule(path, from[path]).then((routeModule) => {
          const route: AppRoute = {
            id: path,
            layout: routeModule.layout ?? 'default',
            name: path
              .slice(6, -4)
              .replace(param, '')
              .replace(/^\/*|\/*$/g, '')
              .replace(/\//g, '_'),
            path:
              routeModule.path ??
              path
                .slice(6, -4)
                .replace(param, (_, m) => `:${m}`)
                .replace(/:\w+\+/, '*')
                .replace(/\/index$/, '/')
                .replace(/(.+)\/+$/, (...m) => m[1]),
            ...routeModule,
          } as AppRoute;

          if (route.name === '') {
            route.name = 'catch-all'
          }
          return route
        }),
      )
    }
  }
  const resolvedRoutes = await Promise.all(promises)
  return new Routes(...resolvedRoutes)
}

// CHANGE: The 'routeModule' parameter now has the correct, more flexible type.
function getRouteModuleExports(
  routeModule: Record<string, any>,
): Partial<AppRoute> {
  return {
    id: routeModule.id,
    layout: routeModule.layout,
    path: routeModule.path,
    name: routeModule.name,
    component: routeModule.default as ComponentType,
    getData: routeModule.getData,
    getMeta: routeModule.getMeta,
    onEnter: routeModule.onEnter,
    streaming: routeModule.streaming,
    clientOnly: routeModule.clientOnly,
    serverOnly: routeModule.serverOnly,
    configure: routeModule.configure,
    onRequest: routeModule.onRequest,
    preParsing: routeModule.preParsing,
    preValidation: routeModule.preValidation,
    preHandler: routeModule.preHandler,
    preSerialization: routeModule.preSerialization,
    onError: routeModule.onError,
    onSend: routeModule.onSend,
    onResponse: routeModule.onResponse,
    onTimeout: routeModule.onTimeout,
    onRequestAbort: routeModule.onRequestAbort,
  }
}

async function getRouteModule(
  path: string,
  routeModuleInput: RouteModuleInput,
): Promise<Partial<AppRoute>> {
  if (typeof routeModuleInput === 'function') {
    const routeModule = await routeModuleInput()
    return getRouteModuleExports(routeModule)
  }
  return getRouteModuleExports(routeModuleInput)
}