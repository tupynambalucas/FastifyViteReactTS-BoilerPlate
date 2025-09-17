// console.log('Root component loaded');
import { Suspense } from 'react'
// FIX: Import Route and Routes from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import { AppRoute, Router } from './core'
import type { RootProps } from './types/routes'

export default function Root({
  url,
  routes,
  ctxHydration,
  routeMap,
}: RootProps) {
  routes.map(({ path, component: Component }) =>{
    console.log('Route to be rendered:')
    console.log(path)
    console.log(Component)
  })
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