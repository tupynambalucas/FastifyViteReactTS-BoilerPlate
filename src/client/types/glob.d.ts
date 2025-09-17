declare module '@unhead/react/server?server' {
  import { UnheadProvider } from '@unhead/react'
  export { UnheadProvider }
}

declare module 'react-router-dom/server' {
  // Conforme visto em core.tsx, você está importando StaticRouter.
  // Se outros itens (como StaticRouterProvider) também forem importados/usados
  // deste módulo, você precisará adicioná-los aqui.
  import { StaticRouter } from 'react-router-dom';
  export { StaticRouter };

  // Se você usar StaticRouterProvider ou outros, adicione-os aqui:
  // export { StaticRouterProvider } from 'react-router-dom';
  // export { createStaticHandler } from 'react-router-dom';
}