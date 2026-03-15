import { env } from 'arikajs';

export default {
    /**
     * Default Database Connection Name
     */
    default: env('DB_CONNECTION', 'mysql'),

    /**
     * Database Connections
     */
    connections: {
        sqlite: {
            driver: 'sqlite',
            database: env('DB_DATABASE', './database.sqlite'),
            charset: 'utf8',
        },

        mysql: {
            driver: 'mysql',
            host: env('DB_HOST', '127.0.0.1'),
            port: env('DB_PORT', 3306),
            database: env('DB_DATABASE', 'arikajs'),
            username: env('DB_USERNAME', 'root'),
            password: env('DB_PASSWORD', ''),
            charset: 'utf8mb4',
            timezone: 'local',
            pool: {
                min: 2,
                max: 20
            }
        },

        pgsql: {
            driver: 'pgsql',
            host: env('DB_HOST', '127.0.0.1'),
            port: env('DB_PORT', 5432),
            database: env('DB_DATABASE', 'arikajs'),
            username: env('DB_USERNAME', 'postgres'),
            password: env('DB_PASSWORD', ''),
            charset: 'utf8',
            timezone: 'local',
            pool: {
                min: 2,
                max: 20
            }
        },

        mongodb: {
            driver: 'mongodb',
            host: env('DB_HOST', '127.0.0.1'),
            port: env('DB_PORT', 27017),
            database: env('DB_DATABASE', 'arikajs'),
            username: env('DB_USERNAME', ''),
            password: env('DB_PASSWORD', ''),
            options: {
                useUnifiedTopology: true,
                maxPoolSize: 10,
                minPoolSize: 2
            }
        }
    }
};
