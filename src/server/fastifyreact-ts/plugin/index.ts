import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import viteFastify from '@fastify/vite/plugin'
import {
  prefix,
  resolveId,
  loadVirtualModule,
  createPlaceholderExports,
  loadSource,
} from './virtual.js'
import { closeBundle } from './preload.js'
import type {
  Plugin,
  UserConfig,
  ConfigEnv,
  ResolvedConfig,
  IndexHtmlTransformContext,
} from 'vite'
import type { RollupLog, NormalizedOutputOptions, OutputBundle } from 'rollup'

// Interface for the shared context used across plugin hooks
interface PluginContext {
  root: string
  resolvedConfig: ResolvedConfig
  indexHtml?: string
  resolvedBundle?: OutputBundle
}

export default function viteFastifyReactPlugin (): Plugin[] {
  const context: PluginContext = {
    root: null!,
    resolvedConfig: null!,
  }
  return [
    viteFastify({
      clientModule: '$app/index.ts'
    }),
    {
      name: 'vite-plugin-react-fastify',
      
      config,

      configResolved (config: ResolvedConfig) {
        configResolved.call(context, config)
      },

      resolveId (id: string) {
        return resolveId.call(context, id)
      },

      async load (id: string) {
        // In Vite 5, `this.environment` is available
        const isSsrBuild = (this as any).environment?.config.build?.ssr

        if (id.includes('?server') && !isSsrBuild) {
          const source = loadSource(id)
          return createPlaceholderExports(source)
        }
        if (id.includes('?client') && isSsrBuild) {
          const source = loadSource(id)
          return createPlaceholderExports(source)
        }
        if (prefix.test(id)) {
          const [, virtual] = id.split(prefix)
          if (virtual) {
            return loadVirtualModule(virtual)
          }
        }
      },

      transformIndexHtml: {
        order: 'post',
        handler (html: string, ctx: IndexHtmlTransformContext) {
          transformIndexHtml.call(context, html, ctx.bundle)
        },
      },

      closeBundle () {
        // `this` context is from Vite's plugin execution
        closeBundle.call(this, context.resolvedBundle)
      },
    },
  ]
}

function transformIndexHtml (this: PluginContext, html: string, bundle?: OutputBundle) {
  if (!bundle) {
    return
  }
  this.indexHtml = html
  this.resolvedBundle = bundle
}

function configResolved (this: PluginContext, config: ResolvedConfig) {
  this.resolvedConfig = config
  this.root = config.root
}

function config (config: UserConfig, { command }: ConfigEnv) {
  if (command === 'build') {
    if (!config.build) {
      config.build = {}
    }
    if (!config.build.rollupOptions) {
      config.build.rollupOptions = {}
    }
    // Ensure onwarn is compatible
    const existingOnWarn = config.build.rollupOptions.onwarn
    config.build.rollupOptions.onwarn = (warning, warn) => {
      onwarn(warning, warn)
      if (existingOnWarn) {
        existingOnWarn(warning, warn)
      }
    }
  }
}

function onwarn (warning: RollupLog, rollupWarn: (warning: RollupLog) => void) {
  if (
    !(
      warning.code === 'MISSING_EXPORT' &&
      warning.message?.includes?.('"scrollBehavior" is not exported')
    ) &&
    !(
      warning.code === 'PLUGIN_WARNING' &&
      warning.message?.includes?.('dynamic import will not move module into another chunk')
    ) &&
    !(
      warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
      (warning.exporter === 'vue' || warning.exporter === 'react') // Also ignore for react
    )
  ) {
    rollupWarn(warning)
  }
}