import type { FastifyPluginAsync } from 'fastify';
import type { SecureSessionPluginOptions } from '@fastify/secure-session';

import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import securesession from '@fastify/secure-session';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';

// Note: The 'jwt' import is unused in the current code since the hook is commented out.
// If you re-enable the hook, this import will be necessary.
import jwt from '@fastify/jwt';

// This block augments the FastifyInstance interface with your custom decorators.
// It makes `server.getClient`, `server.genHash`, etc., available to TypeScript.
declare module 'fastify' {
  interface FastifyInstance {
    getClient(): Promise<MongoClient | undefined>;
    genHash(pass: string, salt: string | number): Promise<string | Error>;
    compareHash(pass: string, docPass: string): Promise<boolean | Error>;
  }
  
  // You might also want to type the session objects if you use them in routes
  interface FastifyRequest {
    user: import('@fastify/secure-session').Session | null;
    admin: import('@fastify/secure-session').Session | null;
  }
}

const secureSessionPlugin: FastifyPluginAsync = async (server) => {
  /**
   * Decorator to get a new MongoDB client instance.
   */
  server.decorate('getClient', async () => {
    try {
      // Ensure your environment variables are loaded before this plugin runs.
      const connectionString = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dg2yjeo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
      return new MongoClient(connectionString);
    } catch (error) {
      server.log.error(error, 'Failed to create MongoDB client');
      // This results in an undefined return value on error.
    }
  });

  /**
   * Decorator to generate a bcrypt hash from a password.
   */
  server.decorate('genHash', async (pass: string, salt: string | number) => {
    try {
      return await bcrypt.hash(pass, salt);
    } catch (error) {
      server.log.error(error, 'Bcrypt hash generation failed');
      // Note: Returning the error object is not ideal. Consider throwing the error instead.
      return error as Error;
    }
  });

  /**
   * Decorator to compare a plain text password with a bcrypt hash.
   */
  server.decorate('compareHash', async (pass: string, docPass: string) => {
    try {
      return await bcrypt.compare(pass, docPass);
    } catch (error) {
      server.log.error(error, 'Bcrypt hash comparison failed');
      return error as Error;
    }
  });

  // Register the @fastify/cookie plugin, which is a dependency for secure-session.
  await server.register(cookie);

  // Await the maxAge value *before* creating the options array.
  const sessionMaxAge = await server.convertTimeToSeconds('hours', 5);

  // Define the configurations for the secure sessions using the pre-calculated maxAge.
  const sessionOptions = [
    {
      sessionName: 'user',
      cookieName: 'userCookie',
      key: Buffer.from(server.config.USER_SESSION_KEY, 'hex'),
      salt: 'mq9hDxBVDbspDR6n',
      cookie: {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: sessionMaxAge, // Use the variable here
      },
    },
    {
      sessionName: 'admin',
      cookieName: 'adminCookie',
      key: Buffer.from(server.config.ADMIN_SESSION_KEY, 'hex'),
      salt: 'mq9hDxBVDbspDR6n',
      cookie: {
        path: '/admin',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: sessionMaxAge, // And here
      },
    },
  ] as const; // Keep the 'as const'

  // Register the @fastify/secure-session plugin with multiple named configurations.
    await server.register(securesession, [...sessionOptions]);

  // The preHandler hook is commented out as in the original file.
  // server.addHook('preHandler', async (req, res) => { ... });
};

export default fp(secureSessionPlugin);