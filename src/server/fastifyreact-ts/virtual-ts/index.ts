import { createRoutes } from '@tupynamba/fastifyreact-ts/server'

export default {
  routes: createRoutes(import('./routes')),
  create: import('./create'),
  context: import('./context'),
}