import { Policy } from './Contracts/Policy';

export class PolicyResolver {
    private policies: Map<any, any> = new Map();
    private instances: Map<any, any> = new Map();

    /**
     * Register a policy for a given model/class.
     */
    public register(model: any, policy: any): void {
        this.policies.set(model, policy);
    }

    private discoveryCallback: ((modelName: string) => any) | null = null;

    /**
     * Register a callback for automatic policy discovery.
     */
    public discoverWith(callback: (modelName: string) => any): void {
        this.discoveryCallback = callback;
    }

    /**
     * Resolve the policy class/constructor for a given resource.
     */
    public resolvePolicy(resource: any): any | null {
        if (!resource) return null;

        // 1. Check by instance constructor (e.g. Task)
        const constructor = typeof resource === 'function' ? resource : resource.constructor;
        if (constructor && this.policies.has(constructor)) {
            return this.policies.get(constructor);
        }

        // 2. Direct lookup (e.g. 'Task')
        if (this.policies.has(resource)) {
            return this.policies.get(resource);
        }

        // 3. Auto-discovery by naming convention (if already partially loaded)
        if (constructor && constructor.name) {
            const policyName = `${constructor.name}Policy`;
            for (const [, policy] of this.policies) {
                const pName = typeof policy === 'function' ? policy.name : policy.constructor?.name;
                if (pName === policyName) {
                    return policy;
                }
            }

            // 4. Global discovery callback
            if (this.discoveryCallback) {
                const policy = this.discoveryCallback(constructor.name);
                if (policy) {
                    this.register(constructor, policy);
                    return policy;
                }
            }
        }

        return null;
    }

    /**
     * Get or create a cached instance for a policy class.
     */
    public getInstance(policy: any): any {
        if (typeof policy !== 'function') return policy;

        if (!this.instances.has(policy)) {
            this.instances.set(policy, new policy());
        }
        return this.instances.get(policy);
    }

    /**
     * Get bound policy method for ability.
     */
    public getPolicyMethod(policy: any, ability: string): Function | null {
        if (!policy) return null;

        const instance = this.getInstance(policy);

        if (typeof instance[ability] === 'function') {
            return instance[ability].bind(instance);
        }

        return null;
    }
}
