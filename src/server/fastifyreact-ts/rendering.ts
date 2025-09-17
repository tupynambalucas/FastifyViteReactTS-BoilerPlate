// rendering.ts

import { Readable } from 'node:stream'
import { Minipass } from 'minipass'
import { renderToPipeableStream } from 'react-dom/server'
import * as devalue from 'devalue'
import { transformHtmlTemplate } from '@unhead/react/server'
import React from 'react'

// --- Type Imports ---
import type { ReactElement } from 'react'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ViteDevServer } from 'vite'
import type RouteContext from './context.js'
import { createHtmlTemplates } from './templating.js'

// --- Interface & Type Definitions ---

interface AppRoute {
  path: string
  app: ReactElement
  clientOnly: boolean
  serverOnly: boolean
  streaming: boolean
  toJSON(): object
  [key: string]: any
}

interface TemplatePair {
  beforeElement: (payload: Record<string, unknown>) => string;
  afterElement: (payload: Record<string, unknown>) => string;
}

interface HtmlTemplates {
  universal: TemplatePair
  serverOnly: TemplatePair
}

interface RenderResult {
  routes: AppRoute[]
  context: RouteContext
  body?: Minipass
}

// --- Module Augmentation for Fastify ---
declare module 'fastify' {
  interface FastifyRequest {
    route: RouteContext
  }
  interface FastifyReply {
    render(): Promise<RenderResult>
  }
}

// --- Core Functions ---

export function onShellReady(app: ReactElement): Promise<Minipass | Error> {
  const duplex = new Minipass()
  return new Promise((resolve) => {
    try {
      const pipeable = renderToPipeableStream(app, {
        onShellReady() {
          resolve(pipeable.pipe(duplex))
        },
        onError(error) {
          resolve(error as Error)
        },
      })
    } catch (error) {
      resolve(error as Error)
    }
  })
}

export function onAllReady(app: ReactElement): Promise<Minipass | Error> {
  const duplex = new Minipass()
  return new Promise((resolve) => {
    try {
      const pipeable = renderToPipeableStream(app, {
        onAllReady() {
          resolve(pipeable.pipe(duplex))
        },
        onError(error) {
          resolve(error as Error)
        },
      })
    } catch (error) {
      resolve(error as Error)
    }
  })
}

export function createRenderFunction({ routes, create }: { routes: AppRoute[], create: unknown }) {
  return function (this: FastifyReply) {
    if (this.request.route.streaming) {
      return createStreamingResponse(this.request, routes)
    }
    return createResponse(this.request, routes)
  }
}

async function createStreamingResponse(req: FastifyRequest, routes: AppRoute[]): Promise<RenderResult> {
  if (!req.route.app) {
    throw new Error('Route application element (`app`) is not available on the request context.')
  }
  const body = await onShellReady(req.route.app)
  if (body instanceof Error) {
    throw body
  }
  return { routes, context: req.route, body }
}

async function createResponse(req: FastifyRequest, routes: AppRoute[]): Promise<RenderResult> {
  console.log(req.route)
  // Remove the conditional check. Always render the application element.
  // The logic inside AppRoute (core.tsx) will correctly handle the difference
  // between a normal page and a clientOnly placeholder.
  if (!req.route.app) {
    throw new Error('Route application element (`app`) is not available on the request context.');
  }
  const result = await onAllReady(req.route.app);
  if (result instanceof Error) {
    throw result;
  }
  const body = result;
  
  return { routes, context: req.route, body };
}

export async function createHtmlFunction(source: string, _: unknown, config: ViteDevServer['config']) {
  const templates = await createHtmlTemplates(source, config)
  return async function (this: FastifyReply) {
    const { routes, context, body } = await this.render()

    context.useHead.push(context.head)
    this.type('text/html')

    if (context.serverOnly) {
      context.hydration = ''
      return streamShell(templates.serverOnly, context, body)
    }

    context.hydration = `<script>\nwindow.route = ${
      devalue.uneval(context.toJSON())
    }\nwindow.routes = ${
      devalue.uneval(routes.map(route => route.toJSON()))
    }\n</script>`
    
    // The special `if (context.clientOnly)` block is removed.
    return streamShell(templates.universal, context, body)
  }
}

export async function sendClientOnlyShell(templates: TemplatePair, context: RouteContext): Promise<string> {
  const html = `${templates.beforeElement(context as unknown as Record<string, unknown>)}${templates.afterElement(context as unknown as Record<string, unknown>)}`
  return await transformHtmlTemplate(context.useHead, html)
}

export function streamShell(templates: TemplatePair, context: RouteContext, body?: Minipass): Readable {
  return Readable.from(createShellStream(templates, context, body))
}

async function* createShellStream(
  templates: TemplatePair,
  context: RouteContext,
  body?: Minipass,
): AsyncGenerator<string> {
  yield await transformHtmlTemplate(context.useHead, templates.beforeElement(context as unknown as Record<string, unknown>))

  if (body) {
    for await (const chunk of body) {
      yield await transformHtmlTemplate(context.useHead, chunk.toString())
    }
  }

  yield await transformHtmlTemplate(context.useHead, templates.afterElement(context as unknown as Record<string, unknown>))
}