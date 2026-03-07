export default {
    /**
     * Default Cache Store
     */
    default: process.env.CACHE_STORE || 'database',

    /**
     * Cache Stores
     */
    stores: {
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
            mode: process.env.REDIS_MODE || 'standalone', // standalone, sentinel, cluster
            host: process.env.REDIS_HOST || '127.0.0.1',
            password: process.env.REDIS_PASSWORD || null,
            port: process.env.REDIS_PORT || 6379,
            database: process.env.REDIS_DB || 0,
        },
    },

    /**
     * Cache Key Prefix
     */
    prefix: process.env.CACHE_PREFIX || 'arika_cache',
};
