
export default {
    name: process.env.APP_NAME || 'ArikaJS',
    env: process.env.APP_ENV || 'production',
    debug: process.env.APP_DEBUG === 'true',
    url: process.env.APP_URL || 'http://localhost',
    timezone: process.env.APP_TIMEZONE || 'UTC',
    key: process.env.APP_KEY,
};
