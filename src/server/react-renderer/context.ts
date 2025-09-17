import { createHead } from '@unhead/react/server'
import type { Unhead } from '@unhead/react/server'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { ReactElement } from 'react'

/**
 * Defines the shape of the route configuration object.
 */
interface RouteConfig {
  data?: Record<string, unknown>
  layout: string
  getMeta?: (...args: any[]) => any
  getData?: (...args: any[]) => any
  onEnter?: (...args: any[]) => any
  streaming: boolean
  clientOnly: boolean
  serverOnly: boolean
}

/**
 * Defines the shape of the optional context initializer module.
 */
interface ContextInitializer {
  state?: () => Record<string, any>
  default?: (context: RouteContext) => Promise<void> | void
}

const routeContextInspect = Symbol.for('nodejs.util.inspect.custom')

export default class RouteContext {
  // --- Class Properties ---
  app: ReactElement | null
  server: FastifyInstance
  req: FastifyRequest
  reply: FastifyReply
  head: Record<string, any>
  useHead: Unhead
  actionData: Record<string, any>
  state: Record<string, any> | null
  data: Record<string, unknown> | undefined
  firstRender: boolean
  layout: string
  getMeta: boolean
  getData: boolean
  onEnter: boolean
  streaming: boolean
  clientOnly: boolean
  serverOnly: boolean
  hydration?: string
  error?: Error
  /**
   * Statically creates and initializes a new RouteContext instance.
   */
  static async create(
    server: FastifyInstance,
    req: FastifyRequest,
    reply: FastifyReply,
    route: RouteConfig,
    contextInit?: ContextInitializer,
  ): Promise<RouteContext> {
    const routeContext = new RouteContext(server, req, reply, route)
    if (contextInit) {
      if (contextInit.state) {
        routeContext.state = contextInit.state()
      }
      if (contextInit.default) {
        await contextInit.default(routeContext)
      }
    }
    return routeContext
  }

  constructor(
    server: FastifyInstance,
    req: FastifyRequest,
    reply: FastifyReply,
    route: RouteConfig,
  ) {
    this.app = null
    this.server = server
    this.req = req
    this.reply = reply
    this.head = {}
    this.useHead = createHead()
    this.actionData = {}
    this.state = null
    this.data = route.data
    this.firstRender = true
    this.layout = route.layout
    this.getMeta = !!route.getMeta
    this.getData = !!route.getData
    this.onEnter = !!route.onEnter
    this.streaming = route.streaming
    this.clientOnly = route.clientOnly
    this.serverOnly = route.serverOnly
  }

  /**
   * Custom inspector for Node.js `util.inspect()`.
   * Hides verbose objects like `server`, `req`, and `reply` during debugging.
   */
  [routeContextInspect]() {
    return {
      ...this,
      server: { [routeContextInspect]: () => '[Server]' },
      req: { [routeContextInspect]: () => '[Request]' },
      reply: { [routeContextInspect]: () => '[Reply]' },
    }
  }

  /**
   * Serializes the context to a JSON object for client-side hydration.
   */
  toJSON() {
    return {
      actionData: this.actionData,
      state: this.state,
      data: this.data,
      head: this.head,
      layout: this.layout,
      getMeta: this.getMeta,
      getData: this.getData,
      onEnter: this.onEnter,
      firstRender: this.firstRender,
      clientOnly: this.clientOnly,
    }
  }

  /**
   * Extends the RouteContext prototype with additional properties.
   * Note: Modifying prototypes directly is a powerful but advanced pattern.
   */
  public static extend: (
    initial: Record<string, PropertyDescriptor & { value?: any }>,
  ) => void
}

RouteContext.extend = (initial) => {
  const { default: _, ...extra } = initial
  for (const [prop, value] of Object.entries(extra)) {
    // Avoid overwriting core properties
    if (prop !== 'data' && prop !== 'state') {
      Object.defineProperty(RouteContext.prototype, prop, value)
    }
  }
}