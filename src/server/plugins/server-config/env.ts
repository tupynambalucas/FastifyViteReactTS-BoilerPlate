import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';
import type { FastifyEnvOptions } from '@fastify/env';
import { resolve } from 'node:path';

// IMPORTANT: This plugin uses a custom `getProjectRoot` method.
// You must add it to your type declaration file (e.g., fastify-vite.d.ts)
// for TypeScript to recognize it.
/*
  declare module 'fastify' {
    interface FastifyInstance {
      getProjectRoot(): Promise<string> | string;
    }
  }
*/

const envPlugin: FastifyPluginAsync = async (server) => {
  const rootPath = server.getProjectRoot(); // Await the path in case it's async

  // The JSON schema defines the required environment variables.
  // Using 'as const' provides stricter type inference.
  const schema = {
    type: 'object',
    required: [
      'SERVER_HOST',
      'SERVER_PORT',
      'USER_COOKIE_SECRET',
      'ADMIN_COOKIE_SECRET',
      'USER_SESSION_KEY',
      'ADMIN_SESSION_KEY',
    ],
    properties: {
      SERVER_HOST: { type: 'string' },
      SERVER_PORT: { type: 'number' },
      USER_COOKIE_SECRET: { type: 'string' },
      ADMIN_COOKIE_SECRET: { type: 'string' },
      USER_SESSION_KEY: { type: 'string' },
      ADMIN_SESSION_KEY: { type: 'string' },
    },
  } as const;

  // Configuration for the @fastify/env plugin.
  const envOptions: FastifyEnvOptions = {
    confKey: 'config', // Attaches config to `server.config`
    schema: schema,
    dotenv: {
      path: resolve(rootPath, '.env'), // Load .env file from the project root
    },
  };

  // Register the plugin with the defined options.
  await server.register(fastifyEnv, envOptions);
};

// Wrap with `fp` (fastify-plugin) to prevent encapsulation.
// This makes `server.config` available to all other plugins.
export default fp(envPlugin);
