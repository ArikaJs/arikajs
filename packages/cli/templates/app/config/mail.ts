export default {
    default: process.env.MAIL_MAILER || 'log',

    mailers: {
        smtp: {
            transport: 'smtp',
            host: process.env.MAIL_HOST || '127.0.0.1',
            port: Number(process.env.MAIL_PORT || 2525),
            encryption: process.env.MAIL_ENCRYPTION || 'tls',
            username: process.env.MAIL_USERNAME,
            password: process.env.MAIL_PASSWORD,
        },

        log: {
            transport: 'log',
        },

        array: {
            transport: 'array',
        },
    },

    from: {
        address: process.env.MAIL_FROM_ADDRESS || 'hello@example.com',
        name: process.env.MAIL_FROM_NAME || 'Example',
    },
};
