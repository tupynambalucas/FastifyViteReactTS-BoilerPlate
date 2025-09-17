console.log('Client File Loaded')
import {
  createContext,
  useContext,
  lazy,
} from 'react'
import type {
  Context,
  ComponentType,
  LazyExoticComponent,
} from 'react'
import { useSnapshot } from 'valtio'

// --- Type Definitions ---

/**
 * Defines the shape of the data used to hydrate a route.
 * This typically comes from a statically generated list of routes.
 */
interface RouteHydrationInput {
  id: string
  component: () => Promise<{ default: ComponentType<any> }>
}

/**
 * Defines the full route object used within the application after hydration.
 */
interface AppRoute {
  id: string
  loader: () => Promise<{ default: ComponentType<any> }>
  component: LazyExoticComponent<ComponentType<any>>
  // Allows for other route properties like 'path', 'exact', etc.
  [key: string]: any
}

/**
 * Defines the shape of the value held by our RouteContext.
 */
interface RouteContextValue {
  // The Valtio state proxy
  state?: Record<string, any>
  // A static, read-only snapshot of the Valtio state
  snapshot?: Record<string, any>
}

/**
 * By declaring this in the global scope, TypeScript becomes aware of
 * `window.routes`, which is presumably injected into the page by the server.
 */
declare global {
  interface Window {
    routes: AppRoute[]
  }
}

// --- Implementation ---

export const RouteContext: Context<RouteContextValue> = createContext({})

export const isServer: boolean = import.meta.env.SSR;

/**
 * Custom hook to access the route context, providing both the
 * Valtio state proxy and its snapshot for rendering.
 */
export function useRouteContext(): RouteContextValue {
  const routeContext = useContext(RouteContext)

  if (routeContext.state) {
    // On the server, we use the state directly.
    // On the client, `useSnapshot` subscribes the component to state changes.
    routeContext.snapshot = isServer
      ? routeContext.state ?? {}
      : useSnapshot(routeContext.state ?? {})
  }
  return routeContext
}

/**
 * Hydrates the routes from `window.routes` with their dynamic import functions.
 * This connects the route data with the actual component code.
 * @param fromInput Can be an array of route definitions or an object mapping IDs to components.
 */
export async function hydrateRoutes(
  fromInput: RouteHydrationInput[] | Record<string, RouteHydrationInput['component']>,
): Promise<AppRoute[]> {
  let from: Record<string, RouteHydrationInput['component']>
  if (Array.isArray(fromInput)) {
    // Convert array to a more efficient lookup map (ID -> component function)
    from = Object.fromEntries(
      fromInput.map((route) => [route.id, route.component]),
    )
  } else {
    from = fromInput
  }

  // Attach the memoized loader and lazy component to each route from the server.
  return window.routes.map((route) => {
    route.loader = memoImport(from[route.id])
    route.component = lazy(() => route.loader())
    return route
  })
}

/**
 * A memoization utility for dynamic import functions.
 * It ensures that the import() is only called once for a given module.
 * @param func The dynamic import function, e.g., () => import('./MyComponent.tsx')
 */
function memoImport(
  func: () => Promise<{ default: ComponentType<any> }>,
): () => Promise<{ default: ComponentType<any> }> {
  console.log(func)

  // Using Symbols to create unique, non-conflicting property keys
  const kFuncExecuted = Symbol('kFuncExecuted')
  const kFuncValue = Symbol('kFuncValue')

  // To attach properties to the function itself, we cast it to `any`
  // for this internal logic, avoiding more complex type definitions.
  const memoizedFunc = func as any
  memoizedFunc[kFuncExecuted] = false

  return async () => {
    if (!memoizedFunc[kFuncExecuted]) {
      memoizedFunc[kFuncValue] = await memoizedFunc()
      memoizedFunc[kFuncExecuted] = true
    }
    return memoizedFunc[kFuncValue]
  }
}