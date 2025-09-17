import { createUnhead } from 'unhead'
import { UnheadProvider as ClientUnheadProvider } from '@unhead/react/client'
import { UnheadProvider as ServerUnheadProvider } from '@unhead/react/server?server'
import Root from './root'
import type { RootProps } from './types/routes'

export default function create(props: RootProps) {
  const isServer = import.meta.env.SSR

  const UnheadProvider = isServer ? ServerUnheadProvider : ClientUnheadProvider
  const head = createUnhead()

  return (
    <UnheadProvider head={head}>
      {/* It simply renders the Root component */}
      <Root {...props} />
    </UnheadProvider>
  )
}