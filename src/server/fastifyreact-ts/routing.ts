import { readFileSync } from 'node:fs'
import { join, isAbsolute } from 'node:path'
import Youch from 'youch'

// --- Type Imports ---
import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  RouteOptions,
  onRequestHookHandler,
  preHandlerHookHandler,
  RouteHandlerMethod,
} from 'fastify'
import type { ViteDevServer } from 'vite'
import type { ReactElement } from 'react'
import RouteContext from './context.js'
import { createHtmlFunction } from './rendering.js'

// --- Interface & Type Definitions ---

// The shape of a route after being processed, used on the client.
interface ClientRoute {
  path: string
  [key: string]: any
}

// The structure of the context initialization module.
interface ContextInitializer {
  state?: () => Record<string, any>
  default?: (context: RouteContext) => Promise<void> | void
  [key: string]: any // To allow for extension properties
}

// The function signature for creating the main React application.
type CreateAppFunction = (options: {
  routes: ClientRoute[]
  routeMap: Record<string, ClientRoute>
  ctxHydration: RouteContext
  url: string
}) => ReactElement

// The structure of the client-side entry module.
interface ClientModule {
  context: ContextInitializer | Promise<ContextInitializer>
  routes: ClientRoute[] | Promise<ClientRoute[]>
  create: CreateAppFunction | Promise<{ default: CreateAppFunction }>
}

// The structure of the main entries object.
interface ClientEntries {
  ssr: ClientModule
}

// The configuration for a specific route handler.
interface AppRouteConfig extends Partial<RouteOptions> {
  id: string
  path: string
  layout: string
  streaming: boolean
  clientOnly: boolean
  serverOnly: boolean
  method?: string[]
  configure?: (scope: FastifyInstance) => Promise<void> | void
  getData?: (context: RouteContext) => Promise<Record<string, any>> | Record<string, any>
  getMeta?: (context: RouteContext) => Promise<Record<string, any>> | Record<string, any>
  onEnter?: (context: RouteContext) => Promise<Record<string, any>> | Record<string, any>
}

// The main configuration object for the Fastify/Vite plugin.
interface FastifyViteConfig {
  dev: boolean
  vite: ViteDevServer['config']
}

type ErrorHandler = (error: Error, req: FastifyRequest, reply: FastifyReply) => Promise<void | FastifyReply>

// --- Core Functions ---

export async function prepareClient(entries: ClientEntries, _: unknown): Promise<ClientModule> {
  const client = entries.ssr

  if (client.context instanceof Promise) {
    client.context = await client.context
  }
  if (client.routes instanceof Promise) {
    client.routes = await client.routes
  }
  if (typeof client.create !== 'function' || 'then' in client.create) {
    const { default: create } = await (client.create as unknown as Promise<{ default: CreateAppFunction }>)
    client.create = create
  }

  return client as ClientModule
}

export function createErrorHandler(_: unknown, scope: FastifyInstance, config: FastifyViteConfig): ErrorHandler {
  return async (error: Error, req: FastifyRequest, reply: FastifyReply) => {
    req.log.error(error)
    if (config.dev) {
      const youch = new Youch(error, req.raw)
      reply.code(500)
      reply.type('text/html')
      reply.send(await youch.toHTML())
      return
    }
    reply.code(500)
    reply.send('')
  }
}

export async function createRoute(
  { client, errorHandler, route }: { client: ClientModule, errorHandler: ErrorHandler, route: AppRouteConfig },
  scope: FastifyInstance,
  config: FastifyViteConfig,
) {
  scope.log.info(`Creating Route: ${route.path} -> ${route.id}`)

  if (route.configure) {
    await route.configure(scope)
  }
  const routeMap = Object.fromEntries((client.routes as ClientRoute[]).map(_ => [_.path, _]))

  const context = client.context instanceof Promise
    ? await client.context
    : client.context

  RouteContext.extend(context as Record<string, PropertyDescriptor & { value?: any }>)

  const onRequest: onRequestHookHandler = async (req, reply) => {
    req.route = await RouteContext.create(scope, req, reply, route, context)
  }

  const preHandler: preHandlerHookHandler[] = [
    async (req) => {
      // REMOVED: if (!req.route.clientOnly)
      // The app element must always be created. The logic inside AppRoute
      // will correctly handle whether to render the full page or a placeholder.
      const app = (client.create as CreateAppFunction)({
        routes: client.routes as ClientRoute[],
        routeMap,
        ctxHydration: req.route,
        url: req.url,
      })
      req.route.app = app
    },
  ]

  if (route.getData) {
    preHandler.push(async (req) => {
      if (!req.route.data) {
        req.route.data = {}
      }
      const result = await route.getData!(req.route)
      Object.assign(req.route.data, result)
    })
  }

  if (route.getMeta) {
    preHandler.push(async (req) => {
      req.route.head = await route.getMeta!(req.route)
    })
  }

  if (route.onEnter) {

    preHandler.push(async (req) => {
      try {
        if (!req.route.data) {
          req.route.data = {}
        }
        const result = await route.onEnter!(req.route)
        Object.assign(req.route.data, result)
      } catch (err) {
        if (config.dev) {
          console.error(err)
        }
        req.route.error = err as Error
      }
    })
  }

  let handler: RouteHandlerMethod
  if (config.dev) {
    handler = (_, reply) => (reply as any).html()
  } else {
    scope.log.info('Running On --prod Mode')
    const { id } = route
    const htmlPath = id.replace(/pages\/(.*?)\.(j|t)sx/, 'html/$1.html')
    scope.log.debug(`Production HTML Path: ${htmlPath}`)
    let distDir = config.vite.build.outDir
    if (!isAbsolute(distDir)) {
      distDir = join(config.vite.root, distDir)
    }
    const htmlSource = readFileSync(join(distDir, htmlPath), 'utf8')
    const htmlFunction = await createHtmlFunction(htmlSource, scope, config.vite)
    handler = (_, reply) => htmlFunction.call(reply)
  }

  const routePath = route.path.replace(/:[^+]+\+/, '*')
  scope.log.info(`Registering Route -> ${routePath}`)
  unshiftHook(route, 'onRequest', onRequest)
  unshiftHook(route, 'preHandler', preHandler)

  scope.route({
    url: routePath,
    method: route.method ?? ['GET', 'POST', 'PUT', 'DELETE'],
    errorHandler,
    handler,
    ...route,
  })

  if (route.getData) {
    scope.get(`/-/data${routePath}`, {
      onRequest,
      async handler(req, reply) {
        reply.send(await route.getData!(req.route))
      },
    })
  }
}

function unshiftHook(route: Record<string, any>, hookName: string, hook: unknown | unknown[]) {
  if (!route[hookName]) {
    route[hookName] = []
  }
  if (!Array.isArray(hook)) {
    hook = [hook]
  }
  if (!Array.isArray(route[hookName])) {
    route[hookName] = [route[hookName]]
  }
  route[hookName].unshift(...(hook as any[]))
}