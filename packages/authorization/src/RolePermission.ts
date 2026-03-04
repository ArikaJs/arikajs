/**
 * Contracts for entities that have roles and permissions.
 */

export interface HasRoles {
    roles?: string[] | { name: string }[];
    hasRole(role: string | string[]): boolean;
    hasAnyRole(roles: string[]): boolean;
    hasAllRoles(roles: string[]): boolean;
}

export interface HasPermissions {
    permissions?: string[] | { name: string }[];
    hasPermission(permission: string): boolean;
    hasAnyPermission(permissions: string[]): boolean;
    hasAllPermissions(permissions: string[]): boolean;
}

/**
 * Mixin helper to add Role & Permission checking to any user object.
 * Works with both string arrays and object arrays ({name: string}).
 */
export class RolePermissionMixin {

    /**
     * Normalize roles/permissions to string arrays.
     */
    private static normalize(items: any[] | undefined): string[] {
        if (!items) return [];
        return items.map((item: any) => typeof item === 'string' ? item : item.name);
    }

    public static hasRole(user: any, role: string | string[]): boolean {
        const userRoles = this.normalize(user.roles);
        if (Array.isArray(role)) {
            return role.every(r => userRoles.includes(r));
        }
        return userRoles.includes(role);
    }

    public static hasAnyRole(user: any, roles: string[]): boolean {
        const userRoles = this.normalize(user.roles);
        return roles.some(r => userRoles.includes(r));
    }

    public static hasAllRoles(user: any, roles: string[]): boolean {
        const userRoles = this.normalize(user.roles);
        return roles.every(r => userRoles.includes(r));
    }

    public static hasPermission(user: any, permission: string): boolean {
        // Check direct permissions
        const userPerms = this.normalize(user.permissions);
        if (userPerms.includes(permission)) return true;

        // Check role-based permissions via a role→permissions map if user has rolePermissions
        if (user.rolePermissions && typeof user.rolePermissions === 'object') {
            const userRoles = this.normalize(user.roles);
            for (const role of userRoles) {
                const rolePerms: string[] = user.rolePermissions[role] || [];
                if (rolePerms.includes(permission)) return true;
            }
        }

        return false;
    }

    public static hasAnyPermission(user: any, permissions: string[]): boolean {
        return permissions.some(p => this.hasPermission(user, p));
    }

    public static hasAllPermissions(user: any, permissions: string[]): boolean {
        return permissions.every(p => this.hasPermission(user, p));
    }
}
