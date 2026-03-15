import { env } from 'arikajs';

export default {
    /**
     * Default Log Channel
     */
    default: env('LOG_CHANNEL', 'stack'),

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
            level: env('LOG_LEVEL', 'debug'),
        },

        daily: {
            driver: 'daily',
            path: './storage/logs/arika.log',
            level: env('LOG_LEVEL', 'debug'),
            days: 14,
        },

        console: {
            driver: 'console',
            level: env('LOG_LEVEL', 'debug'),
        },
    },
};
