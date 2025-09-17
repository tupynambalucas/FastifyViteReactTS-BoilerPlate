import { createRoutes } from '@tupynamba/fastifyvite-react-renderer/server'
// console.log('Routes and create function imported');
export default {
  routes: createRoutes(import('./routes')),
  create: import('./create'),
  context: import('./context'),
}