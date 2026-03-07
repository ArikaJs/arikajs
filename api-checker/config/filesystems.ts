export default {
    /**
     * Default Filesystem Disk
     */
    default: process.env.FILESYSTEM_DISK || 'local',

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
            url: (process.env.APP_URL || 'http://localhost:3000') + '/storage',
        },

        s3: {
            driver: 's3',
            key: process.env.AWS_ACCESS_KEY_ID,
            secret: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
            bucket: process.env.AWS_BUCKET,
            url: process.env.AWS_URL,
            endpoint: process.env.AWS_ENDPOINT,
            forcePathStyle: process.env.AWS_USE_PATH_STYLE_ENDPOINT === 'true',
        },
    },
};
