import { PolicyResolver } from './PolicyResolver';
import { AuthorizationException } from './Exceptions/AuthorizationException';
import { AuthResponse } from './AuthResponse';

type GateCallback = (user: any, ...args: any[]) => boolean | AuthResponse | Promise<boolean | AuthResponse>;
type BeforeCallback = (user: any, ability: string, ...args: any[]) => boolean | null | undefined | Promise<boolean | null | undefined>;
type AfterCallback = (user: any, ability: string, result: boolean, ...args: any[]) => void | Promise<void>;

export class Gate {
    private static abilities: Map<string, GateCallback> = new Map();
    private static policyResolver: PolicyResolver = new PolicyResolver();
    private static beforeCallbacks: BeforeCallback[] = [];
    private static afterCallbacks: AfterCallback[] = [];
    private static currentUser: any = null;

    // ── Gate Definitions ────────────────────────────────────────────

    /**
     * Define a new ability.
     */
    public static define(ability: string, callback: GateCallback): void {
        this.abilities.set(ability, callback);
    }

    /**
     * Register a policy for a model.
     */
    public static policy(model: any, policy: any): void {
        this.policyResolver.register(model, policy);
    }

    // ── Before / After Hooks ────────────────────────────────────────

    /**
     * Register a callback to run before all gate checks.
     * Return `true` to allow immediately (super admin bypass).
     * Return `false` to deny immediately.
     * Return `null`/`undefined` to continue to the actual gate check.
     */
    public static before(callback: BeforeCallback): void {
        this.beforeCallbacks.push(callback);
    }

    /**
     * Register a callback to run after all gate checks.
     * Useful for logging, auditing decisions, etc.
     */
    public static after(callback: AfterCallback): void {
        this.afterCallbacks.push(callback);
    }

    // ── User Binding ────────────────────────────────────────────────

    /**
     * Set the current user for authorization checks.
     */
    public static forUser(user: any): typeof Gate {
        this.currentUser = user;
        return this;
    }

    // ── Single Ability Checks ───────────────────────────────────────

    /**
     * Determine if the user is authorized for an ability.
     * Returns the AuthResponse for rich deny messages.
     */
    public static async inspect(ability: string, ...args: any[]): Promise<AuthResponse> {
        // 1. Run before hooks
        for (const cb of this.beforeCallbacks) {
            const beforeResult = await cb(this.currentUser, ability, ...args);
            if (beforeResult === true) {
                return AuthResponse.allow();
            }
            if (beforeResult === false) {
                return AuthResponse.deny();
            }
            // null/undefined = continue
        }

        // 2. Check policy before() method
        if (args.length > 0) {
            const resource = args[0];
            const policy = this.policyResolver.resolvePolicy(resource);
            if (policy) {
                const instance = this.policyResolver.getInstance(policy);
                if (typeof instance.before === 'function') {
                    const policyBefore = await instance.before(this.currentUser, ability, ...args);
                    if (policyBefore === true) return AuthResponse.allow();
                    if (policyBefore === false) return AuthResponse.deny();
                }

                const method = this.policyResolver.getPolicyMethod(policy, ability);
                if (method) {
                    const result = await method(this.currentUser, ...args);
                    const response = this.normalizeResult(result);
                    await this.runAfterCallbacks(ability, response.allowed(), ...args);
                    return response;
                }
            }
        }

        // 3. Check direct gate definition
        if (this.abilities.has(ability)) {
            const callback = this.abilities.get(ability)!;
            const result = await callback(this.currentUser, ...args);
            const response = this.normalizeResult(result);
            await this.runAfterCallbacks(ability, response.allowed(), ...args);
            return response;
        }

        // 4. Default deny
        const response = AuthResponse.deny();
        await this.runAfterCallbacks(ability, false, ...args);
        return response;
    }

    /**
     * Determine if the user is authorized to perform an ability.
     */
    public static async allows(ability: string, ...args: any[]): Promise<boolean> {
        const response = await this.inspect(ability, ...args);
        return response.allowed();
    }

    /**
     * Determine if the user is NOT authorized.
     */
    public static async denies(ability: string, ...args: any[]): Promise<boolean> {
        return !(await this.allows(ability, ...args));
    }

    /**
     * Authorize or throw exception with optional custom message.
     */
    public static async authorize(ability: string, ...args: any[]): Promise<void> {
        const response = await this.inspect(ability, ...args);
        if (response.denied()) {
            throw new AuthorizationException(response.message() || 'This action is unauthorized.', response.code());
        }
    }

    /**
     * Check authorization (alias for allows).
     */
    public static async check(ability: string, ...args: any[]): Promise<boolean> {
        return await this.allows(ability, ...args);
    }

    // ── Bulk Ability Checks ─────────────────────────────────────────

    /**
     * Check if the user can perform ANY of the given abilities.
     */
    public static async any(abilities: string[], ...args: any[]): Promise<boolean> {
        for (const ability of abilities) {
            if (await this.allows(ability, ...args)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if the user can perform ALL of the given abilities.
     */
    public static async every(abilities: string[], ...args: any[]): Promise<boolean> {
        for (const ability of abilities) {
            if (!(await this.allows(ability, ...args))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if the user can perform NONE of the given abilities.
     */
    public static async none(abilities: string[], ...args: any[]): Promise<boolean> {
        for (const ability of abilities) {
            if (await this.allows(ability, ...args)) {
                return false;
            }
        }
        return true;
    }

    // ── Internals ───────────────────────────────────────────────────

    private static normalizeResult(result: boolean | AuthResponse): AuthResponse {
        if (result instanceof AuthResponse) {
            return result;
        }
        return result ? AuthResponse.allow() : AuthResponse.deny();
    }

    private static async runAfterCallbacks(ability: string, result: boolean, ...args: any[]): Promise<void> {
        for (const cb of this.afterCallbacks) {
            await cb(this.currentUser, ability, result, ...args);
        }
    }

    /**
     * Reset all gates, policies, and hooks (useful for testing).
     */
    public static reset(): void {
        this.abilities.clear();
        this.policyResolver = new PolicyResolver();
        this.beforeCallbacks = [];
        this.afterCallbacks = [];
        this.currentUser = null;
    }
}
