import { User } from '../app/Models/User';

export default {
    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This option controls the default authentication "guard" and password
    | reset options for your application.
    |
    */
    default: 'api',

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Next, you may define every authentication guard for your application.
    | Supported Drivers: "session", "jwt", "token", "basic"
    |
    */
    guards: {
        web: {
            driver: 'session',
            provider: 'users',
        },
        api: {
            driver: 'jwt',
            provider: 'users',
            secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
            options: {
                expiresIn: '24h',
            },
        },
    },

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database.
    |
    */
    providers: {
        users: {
            driver: 'eloquent',
            model: User,
        },
    },

    /*
    |--------------------------------------------------------------------------
    | Authentication Throttling & Locking
    |--------------------------------------------------------------------------
    |
    */
    lockout: {
        maxAttempts: 5,
        decayMinutes: 15,
    },
};
