import { Gate } from '../Gate';
import { AuthorizationException } from '../Exceptions/AuthorizationException';
import { RolePermissionMixin } from '../RolePermission';

export class Authorize {
    /**
     * Handle authorization middleware.
     * 
     * Usage:
     *   .middleware('can:edit-post')           → Gate check
     *   .middleware('can:update,post')         → Policy check using req[resourceKey]
     *   .middleware('role:admin')              → Role check
     *   .middleware('permission:edit-posts')   → Permission check
     */
    public async handle(
        request: any,
        next: () => Promise<any>,
        ability: string,
        resourceKey?: string
    ): Promise<any> {
        const user = request.user || (request.auth && await request.auth.user());

        if (!user) {
            throw new AuthorizationException('User not authenticated.');
        }

        // Role-based check: 'role:admin' or 'role:admin,editor'
        if (ability.startsWith('role:')) {
            const roles = ability.substring(5).split(',');
            if (!RolePermissionMixin.hasAnyRole(user, roles)) {
                throw new AuthorizationException(`User does not have the required role.`);
            }
            return next();
        }

        // Permission-based check: 'permission:edit-posts'
        if (ability.startsWith('permission:')) {
            const permissions = ability.substring(11).split(',');
            if (!RolePermissionMixin.hasAnyPermission(user, permissions)) {
                throw new AuthorizationException(`User does not have the required permission.`);
            }
            return next();
        }

        // Standard gate/policy check
        Gate.forUser(user);

        const resource = resourceKey ? request[resourceKey] : null;

        if (resource) {
            await Gate.authorize(ability, resource);
        } else {
            await Gate.authorize(ability);
        }

        return next();
    }
}
