// core.tsx

import { type ComponentType, type ReactNode, useEffect, Suspense } from 'react'
import { createPath } from 'history'
import { BrowserRouter, StaticRouter, useLocation } from 'react-router-dom'
import { proxy } from 'valtio'
import {
  RouteContext,
  useRouteContext,
} from '@tupynamba/fastifyvite-react-renderer/client'

import { waitFetch, waitResource } from './resource'
import layouts from './layouts'
import type { AppRouteProps, AppRouteCtx, HydrationCtx } from './types/routes'
import type { ServerInternals } from './types/runtime'
import type { Unhead } from '@unhead/react/client'


export const isServer = import.meta.env.SSR

export function Router({ children, url }: { children: ReactNode, url?: string }) {
  if (isServer) {
    return <StaticRouter location={url ?? '/'}>{children}</StaticRouter>
  }
  return <BrowserRouter>{children}</BrowserRouter>
}

// --- Helpers ---
let serverActionCounter = 0
export function createServerAction(name?: string): string {
  return `/-/action/${name ?? serverActionCounter++}`
}

// --- Hook: useServerAction ---
export function useServerAction<T = unknown>(
  action: string,
  options: RequestInit = {},
): T {
  if (isServer) {
    const ctx = useRouteContext();
    const serverContext = ctx as HydrationCtx & AppRouteCtx & ServerInternals;
    const { req, server } = serverContext;

    req.route.actionData[action] = waitFetch(
      `${server.serverURL}${action}`,
      options,
      req.fetchMap,
    )
    return req.route.actionData[action] as T
  }

  const bag = window.route.actionData
  if (bag[action]) {
    return bag[action] as T
  }
  bag[action] = waitFetch(action, options)
  return bag[action] as T
}

// --- AppRoute component ---
export function AppRoute({ ctxHydration, ctx, children }: AppRouteProps) {
  // --- Server rendering path ---
  if (isServer) {
    const Layout =
      (layouts[(ctxHydration.layout ?? 'default') as keyof typeof layouts] as ComponentType<{
        children?: ReactNode
      }>) ?? (layouts.default as ComponentType<{ children?: ReactNode }>)

    // If the route is clientOnly, replace children with a Suspense placeholder.
    // This ensures the Layout (and its <main> tag) is still rendered.
    const finalChildren = ctxHydration.clientOnly
      ? <Suspense fallback={null}>{null}</Suspense>
      : children;

    return (
      <RouteContext.Provider
        value={{
          ...ctx,
          ...ctxHydration,
          state: ctxHydration.state ?? {},
        }}
      >
        <Layout>{finalChildren}</Layout>
      </RouteContext.Provider>
    )
  }

  // --- Client rendering path ---
  ctx.firstRender = window.route.firstRender

  if (ctx.firstRender) {
    ctx.data = window.route.data
    ctx.head = window.route.head
  } else {
    ctx.data = undefined
    ctx.head = undefined
  }

  const location = useLocation()
  const path = createPath(location)

  useEffect(() => {
    window.route.firstRender = false
    window.route.actionData = {}
  }, [location])

  if (!ctx.data && ctx.getData) {
    try {
      const { pathname, search } = location
      ctx.data = waitFetch(`/-/data${pathname}${search}`)
    } catch (status) {
      if (status instanceof Error) {
        ctx.error = status
      }
      throw status
    }
  }

  if (!ctx.firstRender && ctx.getMeta) {
    const updateMeta = async () => {
      const { getMeta } = await ctx.loader()
      if (getMeta) {
        ctx.head = await getMeta(ctx as AppRouteCtx)
        ;(ctxHydration.useHead as Unhead<object>)?.push(ctx.head)
      } else {
        console.warn("Loader did not provide getMeta function for path:", path);
      }
    }
    waitResource(path, 'updateMeta', updateMeta)
  }

  if (!ctx.firstRender && ctx.onEnter) {
    const runOnEnter = async () => {
      const { onEnter } = await ctx.loader()
      if (onEnter) {
        const updatedData = await onEnter(ctx as AppRouteCtx)
        if (!ctx.data) {
          ctx.data = {}
        }
        Object.assign(ctx.data, updatedData)
      } else {
        console.warn("Loader did not provide onEnter function for path:", path);
      }
    }
    waitResource(path, 'onEnter', runOnEnter)
  }

  const Layout =
    (layouts[(ctxHydration.layout ?? 'default') as keyof typeof layouts] as ComponentType<{
      children?: ReactNode
    }>) ?? (layouts.default as ComponentType<{ children?: ReactNode }>)
  
  return (
    <RouteContext.Provider
      value={{
        ...ctxHydration,
        ...ctx,
        // proxy only on the client
        state: proxy(ctxHydration.state ?? {}),
      }}
    >
      <Layout>{children}</Layout>
    </RouteContext.Provider>
  )
}