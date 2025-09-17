import { resolve } from 'node:path'
import AutoLoad from '@fastify/autoload'
import cors from '@fastify/cors'
import envConfig from './env.js'
import utils from './utils.js'
import secureSession from '../secureSession.js'
import { initServer } from '../../server.js'
import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'

// Note: The module augmentation for Fastify, which adds custom properties
// like `getServerRoot`, is now handled in a dedicated .d.ts file.

/**
 * A Fastify plugin that registers a suite of other plugins and configurations.
 * @param server The Fastify instance.
 */
const serverAutoRegistry: FastifyPluginAsync = async function (server) {
  // Register custom utility functions
  await server.register(utils)

  // Load and apply environment configurations
  await server.register(envConfig)

  // Register the secure session plugin
  await server.register(secureSession)

  // Automatically load all routes from the 'routes' directory
  await server.register(AutoLoad, {
    dir: resolve(await server.getServerRoot(), 'routes'),
  })

  const networkInterfaceUrl = await server.getNetworkInterface();

  // 2. Start with a base array of your known, static origins
  const allowedOrigins = ['https://www.dropbox.com/'];

  if (networkInterfaceUrl) {
    allowedOrigins.push(networkInterfaceUrl);
  }

  await server.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  });

  // Initialize the main server logic after all plugins are registered
  initServer()
}

// Wrap the plugin with fastify-plugin to avoid encapsulation issues
export default fp(serverAutoRegistry)