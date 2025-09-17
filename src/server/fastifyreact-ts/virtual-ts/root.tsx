import { Route, Routes } from 'react-router-dom'
import { AppRoute, Router } from './core'
import type { RootProps } from './types/routes'

export default function Root({
  url,
  routes,
  ctxHydration,
  routeMap,
}: RootProps) {

  return (
      <Router url={url}>
        <Routes>
          {routes.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <AppRoute
                  ctxHydration={ctxHydration}
                  ctx={routeMap[path]}
                >
                  <Component />
                </AppRoute>
              }
            />
          ))}
        </Routes>
      </Router>
  )
}