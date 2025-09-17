import type { AppRouteDefinition } from './types/routes';

// This is our new factory function
function createAppRoute(definition: AppRouteDefinition): AppRouteDefinition & { toJSON: () => object } {
  return {
    ...definition,
    // Add the required toJSON implementation
    toJSON() {
      // Return a "clean" object with only the data you want on the client
      // We explicitly list properties to avoid sending sensitive data or large objects
      return {
        id: this.id,
        path: this.path,
        name: this.name,
        layout: this.layout,
        clientOnly: this.clientOnly ?? false, // Provide defaults
        serverOnly: this.serverOnly ?? false,
      };
    },
  };
}
// Define the routes array using the factory function
const routes = [
  createAppRoute({ // <-- Wrap the object
    id: '/pages/landPage.tsx',
    path: '/',
    name: 'land',
    layout: 'default',
    clientOnly: true,
    component: () => import('./pages/landPage'),
    getMeta: () => {
      return {
        title: 'Land Page',
        meta: [
          {name:'description', content:'testeeeeeee'}
        ]
      }
    },
  }),
  createAppRoute({ // <-- Wrap the object
    id: '/pages/admin.tsx',
    path: '/admin',
    name: 'admin',
    layout: 'default',
    serverOnly: true,
    component: () => import('./pages/admin'),
    getMeta: () => {
      return {
        title: 'Land Page',
        meta: [
          {name:'description', content:'testeeeeeee'}
        ]
      }
    }
  }),
];

export default routes;