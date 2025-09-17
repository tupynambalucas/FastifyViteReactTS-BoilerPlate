import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { resolve } from 'node:path';
import { networkInterfaces } from 'node:os';

// Define the types for the new decorators.
// This uses module augmentation to add them to the FastifyInstance interface.

const utilsPlugin: FastifyPluginAsync = async (server) => {
  /**
   * Finds the primary local IPv4 address and constructs a full URL.
   * Note: This assumes a network interface named 'Ethernet' exists.
   */
  server.decorate('getNetworkInterface', async () => {
    const interfaces = networkInterfaces();
    // The 'Ethernet' interface might not exist on all systems (e.g., Wi-Fi).
    const mainInterface = interfaces.Ethernet ?? Object.values(interfaces).flat();

    for (const iface of mainInterface) {
      if (iface && iface.family === 'IPv4' && !iface.internal) {
        return `http://${iface.address}:${server.config.SERVER_PORT}`;
      }
    }
    // Returns undefined if no suitable interface is found.
  });

  /**
   * Gets the absolute path to the project's root directory.
   */
  server.decorate('getProjectRoot', () => {
    // Note: import.meta.dirname requires an ES module environment.
    return resolve(import.meta.dirname, '..', '..', '..', '..');
  });

  /**
   * Gets the absolute path to the server's source directory.
   */
  server.decorate('getServerRoot', () => {
    return resolve(import.meta.dirname, '..', '..');
  });

  /**
   * Converts a time duration into seconds.
   */
  server.decorate(
    'convertTimeToSeconds',
    async (type: 'minutes' | 'hours' | 'days', time: number) => {
      switch (type) {
        case 'minutes':
          return time * 60;
        case 'hours':
          return time * 3600;
        case 'days':
          return time * 24 * 60 * 60;
        default:
          // Returns undefined for invalid types.
          return undefined;
      }
    }
  );
};

export default fp(utilsPlugin);