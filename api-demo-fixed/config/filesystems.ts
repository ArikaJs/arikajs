import { env } from 'arikajs';

export default {
    /**
     * Default Filesystem Disk
     */
    default: env('FILESYSTEM_DISK', 'local'),

    /**
     * Filesystem Disks
     */
    disks: {
        local: {
            driver: 'local',
            root: './storage/app',
        },

        public: {
            driver: 'local',
            root: './storage/public',
            url: env('APP_URL', 'http://localhost:3000') + '/storage',
        },

        s3: {
            driver: 's3',
            key: env('AWS_ACCESS_KEY_ID'),
            secret: env('AWS_SECRET_ACCESS_KEY'),
            region: env('AWS_DEFAULT_REGION', 'us-east-1'),
            bucket: env('AWS_BUCKET'),
            url: env('AWS_URL'),
            endpoint: env('AWS_ENDPOINT'),
            forcePathStyle: env('AWS_USE_PATH_STYLE_ENDPOINT', false),
        },
    },
};
