import { env } from 'arikajs';

export default {
    port: env('APP_PORT', 3000),
    host: env('APP_HOST', '0.0.0.0'),
};
