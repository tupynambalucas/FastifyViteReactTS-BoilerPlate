import { defineConfig } from 'vite';
import { resolve, join } from 'node:path';
import viteReact from '@vitejs/plugin-react-swc';
import viteFastify from '@fastify/vite/plugin';
import viteFastifyReact from '@tupynamba/fastifyvite-react-renderer/plugin';
import svgr from 'vite-plugin-svgr';

console.log(resolve(import.meta.dirname, 'src', 'client'))
export default defineConfig({
  root: join(import.meta.dirname, 'src', 'client'),
  plugins: [
    viteReact(),
    viteFastify(),
    viteFastifyReact({ts: true}),
    svgr({
      include: "**/*.svg?react"
    })
  ],


  resolve: {
    alias: {
        '@reactComponents': resolve(import.meta.dirname, 'src/client/components/react'),
        '@cssComponents': resolve(import.meta.dirname, 'src/client/components/css'),
        '@componentAssets': resolve(import.meta.dirname, 'src/client/assets/components'),
        '@midiaAssets': resolve(import.meta.dirname, 'src/client/assets/midia'),
        '@fontAssets': resolve(import.meta.dirname, 'src/client/assets/fonts'),
        '@type': resolve(import.meta.dirname, 'src/client/types')
    },
    extensions: ['.js', '.json', '.ts', '.tsx'] 
  },

  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]__[hash:base64:5]*'
    }
  },

  build: {
    ssrManifest: true,
    ssr: true,
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Update your entry points to .tsx files
        main: 'index.html',
        server: 'index.ts' 
      },
    },
  },
});
