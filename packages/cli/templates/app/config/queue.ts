import { env } from 'arikajs';

export default {
    /**
     * Default Queue Connection Name
     */
    default: env('QUEUE_CONNECTION', 'sync'),

    /**
     * Queue Connections
     */
    connections: {
        sync: {
            driver: 'sync',
        },

        database: {
            driver: 'database',
            table: 'jobs',
            queue: 'default',
            retry_after: 90,
            after_commit: false,
        },
    },

    /**
     * Job Batching
     */
    batching: {
        database: env('DB_CONNECTION', 'mysql'),
        table: 'job_batches',
    },

    /**
     * Failed Queue Jobs
     */
    failed: {
        driver: env('QUEUE_FAILED_DRIVER', 'database-uuids'),
        database: env('DB_CONNECTION', 'mysql'),
        table: 'failed_jobs',
    },
};
