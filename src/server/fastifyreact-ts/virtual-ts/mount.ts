// client/mount.ts
import { type ReactElement } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { hydrateRoutes } from '@tupynamba/fastifyreact-ts/client'
import { createHead, type Unhead } from '@unhead/react/client'
import create from './create.tsx'
import * as context from './context.ts'

import type {
  ProcessedRoute,
  HydrationCtx,
  BootstrapRoute,
  AppRouteDefinition,
  RootProps,
} from './types/routes'
import routeDefinitions from './routes.ts'

// The context module shape
interface ContextModule {
  default?: (ctx: HydrationCtx) => Promise<void> | void
  state?: any
  [key: string]: any
}

// ## Application Mounting

async function mountApp(...targets: string[]): Promise<void> {
  // Use a two-step assertion: as unknown as ProcessedRoute[]
  const resolvedRoutes = (await hydrateRoutes(
    routeDefinitions,
  )) as unknown as ProcessedRoute[]

  const routeMap: Record<string, ProcessedRoute> = Object.fromEntries(
    resolvedRoutes.map((route) => [route.path, route]),
  )

  const clientUnhead: Unhead<object> = createHead()

  // FIX: Read the context directly from window.route
  const serverProvidedCtxHydration = window.route ?? {}

  const ctxHydration: HydrationCtx = await extendContext(
    serverProvidedCtxHydration as HydrationCtx,
    context,
  )

  ctxHydration.useHead = clientUnhead

  if (window.route.head) {
    ctxHydration.useHead.push(window.route.head)
  }

  const app: ReactElement = create({
    ctxHydration,
    routes: resolvedRoutes,
    routeMap,
    url: window.route.url,
    head: (window.route.head ?? {}) as Record<string, unknown>,
  })

  let mountTargetFound = false
  for (const target of targets) {
    const targetElem = document.querySelector(target)
    if (targetElem) {
      mountTargetFound = true
      // This conditional logic will now work correctly
      if (ctxHydration.clientOnly) {
        createRoot(targetElem).render(app)
      } else {
        hydrateRoot(targetElem, app)
      }
      break
    }
  }

  if (!mountTargetFound) {
    throw new Error(
      `No mount element found from provided list of targets: ${targets}`,
    )
  }
}

// Initial call to mount the app
mountApp('#root', 'main')

// ## Context Extension Utility

async function extendContext(
  ctx: HydrationCtx,
  {
    default: setter,
    state, // intentionally discarded
    ...extra
  }: ContextModule,
): Promise<HydrationCtx> {
  Object.assign(ctx, extra)
  if (setter) {
    await setter(ctx)
  }
  return ctx
}