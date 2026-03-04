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

    /**
     * Resolve the policy class/constructor for a given resource.
     */
    public resolvePolicy(resource: any): any | null {
        if (!resource) return null;

        // Check by constructor
        const constructor = resource.constructor;
        if (constructor && this.policies.has(constructor)) {
            return this.policies.get(constructor);
        }

        // Direct lookup
        if (this.policies.has(resource)) {
            return this.policies.get(resource);
        }

        // Auto-discovery by naming convention
        if (constructor && constructor.name) {
            const policyName = `${constructor.name}Policy`;
            for (const [, policy] of this.policies) {
                const pName = typeof policy === 'function' ? policy.name : policy.constructor?.name;
                if (pName === policyName) {
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
