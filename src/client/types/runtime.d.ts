import type { MetaInfo, HydrationCtx, AppRouteCtx, BootstrapRoute, ProcessedRoute } from './routes'

declare global {
  interface Window {
    route: BootstrapRoute
    routes: ProcessedRoute[] // Adicionado para consistência com mount.ts
  }
}

// Extra context o renderer provê quando SSR está ativo
export interface ServerInternals {
  server: { serverURL: string }
  req: {
    fetchMap: Map<string, unknown>
    route: { actionData: Record<string, unknown> }
  }
}

// Contexto visto no cliente durante a navegação (pós-hidratação)
export interface ClientInternals {
  actionData: Record<string, unknown>
}

// O shape do contexto disponível via useRouteContext()
export type RouteCtx = HydrationCtx &
  AppRouteCtx &
  Partial<ServerInternals> &
  Partial<ClientInternals>