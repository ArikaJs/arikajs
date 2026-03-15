import { env } from 'arikajs';

export default {
    /**
     * Default Cache Store
     */
    default: env('CACHE_STORE', 'file'),

    /**
     * Cache Stores
     */
    stores: {
        file: {
            driver: 'file',
            path: 'storage/cache/data',
        },

        memory: {
            driver: 'memory',
        },

        database: {
            driver: 'database',
            table: 'cache',
            connection: null,
            lock_connection: null,
        },

        redis: {
            driver: 'redis',
            connection: 'default',
            mode: env('REDIS_MODE', 'standalone'), // standalone, sentinel, cluster
            host: env('REDIS_HOST', '127.0.0.1'),
            password: env('REDIS_PASSWORD', null),
            port: env('REDIS_PORT', 6379),
            database: env('REDIS_DB', 0),
        },
    },

    /**
     * Cache Key Prefix
     */
    prefix: env('CACHE_PREFIX', 'arika_cache'),
};
