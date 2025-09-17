import 'fastify';
import type { MongoClient } from 'mongodb';

declare module 'fastify' {
    interface FastifyInstance {
        getNetworkInterface(): Promise<string | undefined>;
        getProjectRoot(): string;
        getServerRoot(): string;
        convertTimeToSeconds(
            type: 'minutes' | 'hours' | 'days',
            time: number
        ): Promise<number | undefined>;
        getClient(): Promise<MongoClient | undefined>;
        genHash(pass: string, salt: string | number): Promise<string | Error>;
        compareHash(pass: string, docPass: string): Promise<boolean | Error>;
        config: {
            SERVER_HOST: string;
            SERVER_PORT: number;
            USER_COOKIE_SECRET: string;
            ADMIN_COOKIE_SECRET: string;
            USER_SESSION_KEY: string;
            ADMIN_SESSION_KEY: string;
        };
        // This property is added by the @fastify/vite plugin.
        vite: {
            ready(): Promise<void>;
        };
    }
    interface FastifyRequest {
        user: import('@fastify/secure-session').Session | null;
        admin: import('@fastify/secure-session').Session | null;
    }
}
