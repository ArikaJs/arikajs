
export default {
    port: parseInt(process.env.APP_PORT || '3000', 10),
    host: process.env.APP_HOST || '0.0.0.0',
};
