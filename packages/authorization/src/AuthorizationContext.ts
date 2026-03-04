import { Gate } from './Gate';
import { AuthResponse } from './AuthResponse';
import { RolePermissionMixin } from './RolePermission';

/**
 * Per-request authorization context.
 * Avoids the global mutable `Gate.currentUser` problem under concurrency.
 * Each request gets its own `AuthorizationContext` with an isolated user reference.
 */
export class AuthorizationContext {
    private user: any;
    private cache: Map<string, boolean> = new Map();

    constructor(user: any) {
        this.user = user;
    }

    // ── Single ability checks ───────────────────────────────────────

    public async can(ability: string, ...args: any[]): Promise<boolean> {
        const cacheKey = this.buildCacheKey(ability, args);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const result = await Gate.forUser(this.user).allows(ability, ...args);
        this.cache.set(cacheKey, result);
        return result;
    }

    public async cannot(ability: string, ...args: any[]): Promise<boolean> {
        return !(await this.can(ability, ...args));
    }

    public async authorize(ability: string, ...args: any[]): Promise<void> {
        await Gate.forUser(this.user).authorize(ability, ...args);
    }

    public async inspect(ability: string, ...args: any[]): Promise<AuthResponse> {
        return await Gate.forUser(this.user).inspect(ability, ...args);
    }

    // ── Bulk ability checks ─────────────────────────────────────────

    public async any(abilities: string[], ...args: any[]): Promise<boolean> {
        return await Gate.forUser(this.user).any(abilities, ...args);
    }

    public async every(abilities: string[], ...args: any[]): Promise<boolean> {
        return await Gate.forUser(this.user).every(abilities, ...args);
    }

    public async none(abilities: string[], ...args: any[]): Promise<boolean> {
        return await Gate.forUser(this.user).none(abilities, ...args);
    }

    // ── Role & Permission checks (via mixin) ────────────────────────

    public hasRole(role: string | string[]): boolean {
        return RolePermissionMixin.hasRole(this.user, role);
    }

    public hasAnyRole(roles: string[]): boolean {
        return RolePermissionMixin.hasAnyRole(this.user, roles);
    }

    public hasAllRoles(roles: string[]): boolean {
        return RolePermissionMixin.hasAllRoles(this.user, roles);
    }

    public hasPermission(permission: string): boolean {
        return RolePermissionMixin.hasPermission(this.user, permission);
    }

    public hasAnyPermission(permissions: string[]): boolean {
        return RolePermissionMixin.hasAnyPermission(this.user, permissions);
    }

    public hasAllPermissions(permissions: string[]): boolean {
        return RolePermissionMixin.hasAllPermissions(this.user, permissions);
    }

    // ── Internals ───────────────────────────────────────────────────

    public getUser(): any {
        return this.user;
    }

    /**
     * Clear the authorization cache (e.g. after role change mid-request).
     */
    public flushCache(): void {
        this.cache.clear();
    }

    private buildCacheKey(ability: string, args: any[]): string {
        // Build a simple cache key from ability + resource IDs
        const argIds = args.map(a => {
            if (a && typeof a === 'object' && a.id !== undefined) return `${a.constructor?.name || 'obj'}:${a.id}`;
            if (a && typeof a === 'object' && a.constructor) return a.constructor.name;
            return String(a);
        });
        return `${ability}:${argIds.join(',')}`;
    }
}
