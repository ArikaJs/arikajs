
export default {
    /**
     * Default Database Connection Name
     */
    default: process.env.DB_CONNECTION || 'mysql',

    /**
     * Database Connections
     */
    connections: {
        sqlite: {
            driver: 'sqlite',
            database: process.env.DB_DATABASE || './database.sqlite',
            charset: 'utf8',
        },

        mysql: {
            driver: 'mysql',
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '3306'),
            database: process.env.DB_DATABASE || 'arikajs',
            username: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || '',
            charset: 'utf8mb4',
            timezone: 'local',

            /**
             * Read/Write Splitting (Optional)
             * 
             * ArikaJS automatically routes SELECT queries to 'read' replicas
             * and INSERT/UPDATE/DELETE queries to the 'write' master.
             */
            /*
            write: {
                host: process.env.DB_HOST_WRITE || '127.0.0.1',
            },
            read: [
                { host: process.env.DB_HOST_READ_1 || '127.0.0.1' },
                { host: process.env.DB_HOST_READ_2 || '127.0.0.1' },
            ],
            */

            /**
             * Connection Pooling
             */
            pool: {
                min: 2,
                max: 20
            }
        },

        pgsql: {
            driver: 'pgsql',
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_DATABASE || 'arikajs',
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '',
            charset: 'utf8',
            timezone: 'local',
            pool: {
                min: 2,
                max: 20
            }
        },

        mongodb: {
            driver: 'mongodb',
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '27017'),
            database: process.env.DB_DATABASE || 'arikajs',
            username: process.env.DB_USERNAME || '',
            password: process.env.DB_PASSWORD || '',
            options: {
                useUnifiedTopology: true,
                maxPoolSize: 10,
                minPoolSize: 2
            }
        }
    }
};
