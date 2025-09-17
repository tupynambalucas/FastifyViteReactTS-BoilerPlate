import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { resolve } from 'node:path';
// import { fileURLToPath } from 'node:url';
import autoRegistry from './plugins/server-config/serverAutoRegistry.js';
import fastifyVite from '@fastify/vite';

// Note: The module augmentation for Fastify, which adds custom properties
// like `config` and `vite`, is now handled in a dedicated .d.ts file.
const loggerConfig = {
  base: true,
  oneLine: {
    logger: {
      transport: {
        target: '@fastify/one-line-logger',
      },
    },
  },
};

// The `as any` assertion is a workaround for a complex module resolution
// issue where TypeScript fails to recognize the default export as a callable function.
const server: FastifyInstance = Fastify({
  logger: {
    // Enable one-line-logger and pass options
    level: 'info', // Set your desired log level
    transport: {
      target: '@fastify/one-line-logger',
      options: {
        // Customize colors for specific log levels
        customColors: {
          info: 'blue',     // Info messages in blue
          warn: 'yellow',   // Warning messages in yellow
          error: 'red',     // Error messages in red
          debug: 'green',   // Debug messages in green
        },
        colorize: true, // Ensure colorization is enabled
      },
    },
  },
});

// A standard pattern to get the directory name in an ES module environment.

await server.register(autoRegistry);

export async function initServer() {
  await server.register(fastifyVite, {
    // Use the calculated __dirname for a reliable path.
    root: resolve(import.meta.dirname, '..', '..'),
    distDir: import.meta.dirname,
    renderer: '@tupynamba/fastifyvite-react-renderer',
  });
  try {
    await server.vite.ready();
    await server.listen({ host: server.config.SERVER_HOST, port: server.config.SERVER_PORT });
    if (process.argv.includes('--dev')) {
      server.log.warn('Running in development mode');
    }
  } catch (error) {
    server.log.error(error);
    // It's good practice to exit on a fatal startup error.
    process.exit(1);
  }
}