
import { Provider } from './Contracts/index.js';
import { GoogleProvider } from './Providers/GoogleProvider.js';
import { GithubProvider } from './Providers/GithubProvider.js';
import { FacebookProvider } from './Providers/FacebookProvider.js';
import { LinkedInProvider } from './Providers/LinkedInProvider.js';
import { GitLabProvider } from './Providers/GitLabProvider.js';
import { SlackProvider } from './Providers/SlackProvider.js';
import { XProvider } from './Providers/XProvider.js';

export class SocialiteManager {
    protected drivers: Map<string, Provider> = new Map();
    protected static request: any;
    protected customCreators: Map<string, (config: any) => Provider> = new Map();

    constructor(protected config: any) {}

    /**
     * Set the request for all future driver instances.
     */
    public setRequest(request: any) {
        SocialiteManager.request = request;
        return this;
    }

    /**
     * Register a custom driver creator Closure.
     */
    public extend(name: string, callback: (config: any) => Provider): this {
        this.customCreators.set(name, callback);
        return this;
    }

    /**
     * Get a driver instance by name.
     */
    public driver(name: string): Provider {
        if (this.customCreators.has(name)) {
            const creator = this.customCreators.get(name)!;
            const provider = creator(this.config.providers[name]);
            if (SocialiteManager.request) {
                provider.setRequest(SocialiteManager.request);
            }
            return provider;
        }

        let configName = name;
        if (name === 'twitter' && !this.config.providers['twitter']) {
            configName = 'x';
        }
        if (name === 'x' && !this.config.providers['x']) {
            configName = 'twitter';
        }

        const driverConfig = this.config.providers[configName];
        
        if (!driverConfig) {
            throw new Error(`Socialite driver [${name}] not configured.`);
        }

        let provider: Provider;

        switch (name) {
            case 'google':
                provider = new GoogleProvider(driverConfig);
                break;
            case 'github':
                provider = new GithubProvider(driverConfig);
                break;
            case 'facebook':
                provider = new FacebookProvider(driverConfig);
                break;
            case 'linkedin':
                provider = new LinkedInProvider(driverConfig);
                break;
            case 'gitlab':
                provider = new GitLabProvider(driverConfig);
                break;
            case 'slack':
                provider = new SlackProvider(driverConfig);
                break;
            case 'x':
            case 'twitter':
                provider = new XProvider(driverConfig);
                break;
            default:
                throw new Error(`Socialite driver [${name}] is not supported yet.`);
        }

        if (SocialiteManager.request) {
            provider.setRequest(SocialiteManager.request);
        }

        return provider;
    }
}
