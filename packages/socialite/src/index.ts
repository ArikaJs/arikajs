import { SocialiteManager } from './SocialiteManager.js';
import type { Provider, User } from './Contracts/index.js';

export let socialite: SocialiteManager;

/**
 * Configure the Socialite service.
 */
export function setSocialiteManager(manager: SocialiteManager) {
    socialite = manager;
}

/**
 * Static Facade for Socialite.
 */
export class Socialite {
    public static driver(name: string): Provider {
        if (!socialite) {
            throw new Error('Socialite is not configured. Please use setSocialiteManager() first.');
        }
        return socialite.driver(name);
    }

    public static extend(name: string, callback: (config: any) => Provider): typeof Socialite {
        if (socialite) {
            socialite.extend(name, callback);
        }
        return this;
    }

    public static setRequest(request: any): typeof Socialite {
        if (socialite) {
            socialite.setRequest(request);
        }
        return this;
    }
}

export { SocialiteManager };
export type { Provider, User };
export { AbstractProvider } from './Providers/AbstractProvider.js';
export { GoogleProvider } from './Providers/GoogleProvider.js';
export { GithubProvider } from './Providers/GithubProvider.js';
export { FacebookProvider } from './Providers/FacebookProvider.js';
export { LinkedInProvider } from './Providers/LinkedInProvider.js';
export { GitLabProvider } from './Providers/GitLabProvider.js';
export { SlackProvider } from './Providers/SlackProvider.js';
export { XProvider } from './Providers/XProvider.js';
export { SocialiteServiceProvider } from './SocialiteServiceProvider.js';
