import { env } from 'arikajs';

export default {
    default: env('MAIL_MAILER', 'log'),

    mailers: {
        smtp: {
            transport: 'smtp',
            host: env('MAIL_HOST', '127.0.0.1'),
            port: env('MAIL_PORT', 2525),
            encryption: env('MAIL_ENCRYPTION', 'tls'),
            username: env('MAIL_USERNAME'),
            password: env('MAIL_PASSWORD'),
        },

        log: {
            transport: 'log',
        },

        array: {
            transport: 'array',
        },
    },

    from: {
        address: env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        name: env('MAIL_FROM_NAME', 'Example'),
    },
};
