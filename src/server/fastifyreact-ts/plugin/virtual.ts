import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { findExports } from 'mlly'
import type { SourceDescription } from 'rollup'

// Define a type for the plugin's `this` context for clarity
interface PluginContext {
  root: string
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const virtualRoot = resolve(__dirname, '..', 'virtual-ts')

const virtualModules = [
  'mount.ts',
  'resource.ts',
  'routes.ts',
  'layouts.ts',
  'create.tsx',
  'root.tsx',
  'layouts/',
  'context.ts',
  'core.tsx',
  'index.ts',
]

export const prefix = /^\/?\$app\//

// Custom type guard for the includes method
const originalIncludes = virtualModules.includes
;(virtualModules as any).includes = function (virtual?: string): boolean {
  if (!virtual) {
    return false
  }
  for (const entry of this) {
    if (virtual.startsWith(entry)) {
      return true
    }
  }
  return false
}

export async function resolveId (this: PluginContext, id: string): Promise<string | undefined> {
  // Paths are prefixed with .. on Windows by the glob import
  if (process.platform === 'win32' && /^\.\.\/[C-Z]:/.test(id)) {
    return id.substring(3)
  }

  if (prefix.test(id)) {
    const [, virtual] = id.split(prefix)
    if (virtual) {
      const override = loadVirtualModuleOverride(this.root, virtual)
      if (override) {
        return override
      }
      return id
    }
  }
}

export function loadVirtualModule (virtualInput: string): SourceDescription | undefined {
  if (!(virtualModules as any).includes(virtualInput)) {
    return
  }
  const codePath = resolve(virtualRoot, virtualInput)
  return {
    code: readFileSync(codePath, 'utf8'),
    map: null,
  }
}

function loadVirtualModuleOverride (viteProjectRoot: string, virtualInput: string): string | undefined {
  if (!(virtualModules as any).includes(virtualInput)) {
    return
  }
  // Check for .ts, .tsx extensions in user's project root
  const overridePathTS = resolve(viteProjectRoot, virtualInput)
  if (existsSync(overridePathTS)) {
    return overridePathTS
  }
  const overridePathTSX = overridePathTS.replace(/\.ts$/, '.tsx')
  if (existsSync(overridePathTSX)) {
    return overridePathTSX
  }
}

export function loadSource (id: string): string {
  const filePath = id
    .replace(/\?client$/, '')
    .replace(/\?server$/, '')
  return readFileSync(filePath, 'utf8')
}

export function createPlaceholderExports (source: string): string {
  let pExports = ''
  const exports = findExports(source)
  for (const exp of exports) {
    switch (exp.type) {
      case 'named':
        for (const name of exp.names) {
          pExports += `export const ${name} = {}\n`
        }
        break
      case 'default':
        pExports += `export default {}\n`
        break
      case 'declaration':
        if (exp.name) {
          pExports += `export const ${exp.name} = {}\n`
        }
        break
    }
  }
  return pExports
}