import { env } from 'arikajs';

export default {
    name: env('APP_NAME', 'ArikaJS'),
    env: env('APP_ENV', 'production'),
    debug: env('APP_DEBUG', false), // env() handles boolean strings if we want, but let's check.
    url: env('APP_URL', 'http://localhost'),
    timezone: env('APP_TIMEZONE', 'UTC'),
    key: env('APP_KEY'),
};
