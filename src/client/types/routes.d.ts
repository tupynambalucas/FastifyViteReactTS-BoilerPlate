import type { ReactNode, ComponentType } from 'react'
import type { Unhead } from '@unhead/react/client'

// Import the unified types from your shared location.
// The path '../..' assumes this file is in 'src/client/types/' and the shared file is in 'src/types/'.
// Adjust the path if your project structure is different.
import type {
  SharedRouteContext,
  SharedRouteDefinition,
  MetaInfo,
} from '../../types/shared'

// --- Type Aliases for Consistency ---
// By creating aliases, you might not need to change the type names used elsewhere in your client code.
export interface AppRouteCtx extends SharedRouteContext {
  // Add back the lifecycle methods and loader from the original route definition
  getData?: (ctx?: AppRouteCtx) => Record<string, unknown> | Promise<Record<string, unknown>>;
  getMeta?: (ctx: AppRouteCtx) => MetaInfo | Promise<MetaInfo>;
  onEnter?: (ctx: AppRouteCtx) => Record<string, unknown> | Promise<Record<string, unknown>>;
  // The loader function returns a module containing the lifecycle methods
  loader: () => Promise<{
    getMeta?: (ctx: AppRouteCtx) => MetaInfo | Promise<MetaInfo>;
    onEnter?: (ctx: AppRouteCtx) => Record<string, unknown> | Promise<Record<string, unknown>>;
  }>;
}

export type AppRouteDefinition = SharedRouteDefinition
export { MetaInfo } // Re-export MetaInfo for convenience

// --- Client-Specific Interfaces ---

// Context available during client-side hydration.
export interface HydrationCtx {
  layout: 'default' | string
  state?: Record<string, unknown>
  useHead?: Unhead<object>
  data?: Record<string, unknown>
  head?: MetaInfo
  actionData: Record<string, unknown>
  firstRender?: boolean
  clientOnly?: boolean
  url?: string
}

// Props for route components like Layouts or Pages.
export interface AppRouteProps {
  ctxHydration: HydrationCtx
  ctx: AppRouteCtx
  children: ReactNode
}

// A route after its component has been loaded (hydrated) on the client.
// It extends AppRouteCtx (now SharedRouteContext) to carry over all context.
export interface ProcessedRoute extends AppRouteCtx {
  id: string
  path: string
  name: string
  serverOnly?: boolean
  component: ComponentType<any> // Component is now fully resolved, not a dynamic import
}

// The structure of the global `window.route` object used for bootstrapping.
export interface BootstrapRoute {
  firstRender: boolean
  url: string
  data?: Record<string, unknown>
  head?: MetaInfo
  actionData: Record<string, unknown>
  ctxHydration?: HydrationCtx
}

// Props for the main <Root> component of your application.
export interface RootProps {
  url: string
  routes: ProcessedRoute[]
  head?: Record<string, unknown>
  ctxHydration: HydrationCtx
  routeMap: Record<string, ProcessedRoute>
}