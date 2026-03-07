export default {
    /**
     * Default Log Channel
     */
    default: process.env.LOG_CHANNEL || 'stack',

    /**
     * Log Channels
     */
    channels: {
        stack: {
            driver: 'stack',
            channels: ['console', 'single'],
            ignore_exceptions: false,
        },

        single: {
            driver: 'file',
            path: './storage/logs/arika.log',
            level: process.env.LOG_LEVEL || 'debug',
        },

        daily: {
            driver: 'daily',
            path: './storage/logs/arika.log',
            level: process.env.LOG_LEVEL || 'debug',
            days: 14,
        },

        console: {
            driver: 'console',
            level: process.env.LOG_LEVEL || 'debug',
        },
    },
};
