import { AuthorizationContext } from './AuthorizationContext';
import { AuthResponse } from './AuthResponse';

export class AuthorizationManager {
    private user: any;
    private context: AuthorizationContext;

    constructor(user: any) {
        this.user = user;
        this.context = new AuthorizationContext(user);
    }

    /**
     * Create a request-scoped authorization context and bind it to the request.
     */
    public static createContext(request: any): AuthorizationContext {
        const user = request.user || (request.auth ? null : null);
        const context = new AuthorizationContext(user);
        request.can = context.can.bind(context);
        request.cannot = context.cannot.bind(context);
        request.authorize = context.authorize.bind(context);
        return context;
    }

    // ── Delegated checks ────────────────────────────────────────────

    public async can(ability: string, ...args: any[]): Promise<boolean> {
        return await this.context.can(ability, ...args);
    }

    public async cannot(ability: string, ...args: any[]): Promise<boolean> {
        return await this.context.cannot(ability, ...args);
    }

    public async authorize(ability: string, ...args: any[]): Promise<void> {
        return await this.context.authorize(ability, ...args);
    }

    public async inspect(ability: string, ...args: any[]): Promise<AuthResponse> {
        return await this.context.inspect(ability, ...args);
    }

    public async any(abilities: string[], ...args: any[]): Promise<boolean> {
        return await this.context.any(abilities, ...args);
    }

    public async every(abilities: string[], ...args: any[]): Promise<boolean> {
        return await this.context.every(abilities, ...args);
    }

    public async none(abilities: string[], ...args: any[]): Promise<boolean> {
        return await this.context.none(abilities, ...args);
    }

    // ── Role & Permission ───────────────────────────────────────────

    public hasRole(role: string | string[]): boolean {
        return this.context.hasRole(role);
    }

    public hasAnyRole(roles: string[]): boolean {
        return this.context.hasAnyRole(roles);
    }

    public hasAllRoles(roles: string[]): boolean {
        return this.context.hasAllRoles(roles);
    }

    public hasPermission(permission: string): boolean {
        return this.context.hasPermission(permission);
    }

    public hasAnyPermission(permissions: string[]): boolean {
        return this.context.hasAnyPermission(permissions);
    }

    public hasAllPermissions(permissions: string[]): boolean {
        return this.context.hasAllPermissions(permissions);
    }
}
