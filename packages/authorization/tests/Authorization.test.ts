import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import {
    Gate,
    AuthorizationManager,
    AuthorizationContext,
    AuthorizationException,
    AuthResponse,
    RolePermissionMixin,
    Policy
} from '../src';

class Post {
    constructor(public id: number, public userId: number, public title: string) { }
}

class PostPolicy implements Policy {
    before(user: any, ability: string): boolean | null {
        if (user.isSuperAdmin) return true;  // Super admin bypass
        return null; // Continue to normal check
    }

    view(user: any, post: Post): boolean {
        return true;
    }

    update(user: any, post: Post): boolean {
        return user.id === post.userId;
    }

    delete(user: any, post: Post): boolean | AuthResponse {
        if (user.id !== post.userId) {
            return AuthResponse.deny('You do not own this post.', 'POST_NOT_OWNED');
        }
        return AuthResponse.allow();
    }
}

describe('Arika Authorization', () => {
    const user = { id: 1, name: 'John', isAdmin: false, isSuperAdmin: false, roles: ['editor'], permissions: ['view-posts'] };
    const adminUser = { id: 2, name: 'Admin', isAdmin: true, isSuperAdmin: false, roles: ['admin', 'editor'], permissions: ['view-posts', 'edit-posts', 'delete-posts'] };
    const superAdmin = { id: 3, name: 'SuperAdmin', isSuperAdmin: true, roles: ['super-admin'], permissions: [] };
    const post = new Post(1, 1, 'Test Post');
    const otherPost = new Post(2, 2, 'Other Post');

    beforeEach(() => {
        Gate.reset();
    });

    afterEach(() => {
        Gate.reset();
    });

    // ── Basic Gate Tests ────────────────────────────────────────────

    it('defines and checks gates', async () => {
        Gate.define('edit-post', (user, post) => user.id === post.userId);

        const canEdit = await Gate.forUser(user).allows('edit-post', post);
        assert.strictEqual(canEdit, true);

        const cannotEdit = await Gate.forUser(user).allows('edit-post', otherPost);
        assert.strictEqual(cannotEdit, false);
    });

    it('denies unauthorized actions', async () => {
        Gate.define('delete-post', (user) => user.isAdmin);

        const denied = await Gate.forUser(user).denies('delete-post', post);
        assert.strictEqual(denied, true);

        const allowed = await Gate.forUser(adminUser).denies('delete-post', post);
        assert.strictEqual(allowed, false);
    });

    // ── Policy Tests ────────────────────────────────────────────────

    it('works with policies', async () => {
        Gate.policy(Post, PostPolicy);

        const canView = await Gate.forUser(user).allows('view', post);
        assert.strictEqual(canView, true);

        const canUpdate = await Gate.forUser(user).allows('update', post);
        assert.strictEqual(canUpdate, true);

        const cannotUpdate = await Gate.forUser(user).allows('update', otherPost);
        assert.strictEqual(cannotUpdate, false);
    });

    // ── Feature 2: before() / after() Hooks ─────────────────────────

    it('runs before() hook on policy for super admin bypass', async () => {
        Gate.policy(Post, PostPolicy);

        // SuperAdmin can update ANY post via before() returning true
        const canUpdate = await Gate.forUser(superAdmin).allows('update', otherPost);
        assert.strictEqual(canUpdate, true);

        // Regular user cannot
        const cannotUpdate = await Gate.forUser(user).allows('update', otherPost);
        assert.strictEqual(cannotUpdate, false);
    });

    it('runs global before() hook', async () => {
        Gate.before((user) => {
            if (user.isSuperAdmin) return true;
            return null;
        });

        Gate.define('admin-only', (user) => user.isAdmin);

        // Super admin bypasses everything
        const allowed = await Gate.forUser(superAdmin).allows('admin-only');
        assert.strictEqual(allowed, true);

        // Regular user denied
        const denied = await Gate.forUser(user).allows('admin-only');
        assert.strictEqual(denied, false);
    });

    it('runs after() hook for auditing', async () => {
        let auditLog: { ability: string, result: boolean }[] = [];

        Gate.after((user, ability, result) => {
            auditLog.push({ ability, result });
        });

        Gate.define('edit-post', (user, post) => user.id === post.userId);

        await Gate.forUser(user).allows('edit-post', post);
        await Gate.forUser(user).allows('edit-post', otherPost);

        assert.strictEqual(auditLog.length, 2);
        assert.strictEqual(auditLog[0].result, true);
        assert.strictEqual(auditLog[1].result, false);
    });

    // ── Feature 3: Bulk Checks ──────────────────────────────────────

    it('Gate.any() checks if user has any of the abilities', async () => {
        Gate.define('edit-post', (user, post) => user.id === post.userId);
        Gate.define('delete-post', (user) => user.isAdmin);

        const hasAny = await Gate.forUser(user).any(['edit-post', 'delete-post'], post);
        assert.strictEqual(hasAny, true); // can edit-post

        const hasNone = await Gate.forUser({ id: 999, isAdmin: false }).any(['edit-post', 'delete-post'], post);
        assert.strictEqual(hasNone, false);
    });

    it('Gate.every() checks if user has all abilities', async () => {
        Gate.define('edit-post', (user, post) => user.id === post.userId);
        Gate.define('publish-post', () => true);

        const hasAll = await Gate.forUser(user).every(['edit-post', 'publish-post'], post);
        assert.strictEqual(hasAll, true);

        Gate.define('admin-only', (user) => user.isAdmin);
        const notAll = await Gate.forUser(user).every(['edit-post', 'admin-only'], post);
        assert.strictEqual(notAll, false);
    });

    it('Gate.none() checks that user has none of the abilities', async () => {
        Gate.define('admin-only', (user) => user.isAdmin);
        Gate.define('super-admin-only', (user) => user.isSuperAdmin);

        const noneForUser = await Gate.forUser(user).none(['admin-only', 'super-admin-only']);
        assert.strictEqual(noneForUser, true);

        const noneForAdmin = await Gate.forUser(adminUser).none(['admin-only', 'super-admin-only']);
        assert.strictEqual(noneForAdmin, false);
    });

    // ── Feature 4: Response-Based Authorization ─────────────────────

    it('returns custom deny message via AuthResponse', async () => {
        Gate.policy(Post, PostPolicy);

        const response = await Gate.forUser(user).inspect('delete', otherPost);
        assert.strictEqual(response.denied(), true);
        assert.strictEqual(response.message(), 'You do not own this post.');
        assert.strictEqual(response.code(), 'POST_NOT_OWNED');

        const allowResponse = await Gate.forUser(user).inspect('delete', post);
        assert.strictEqual(allowResponse.allowed(), true);
    });

    it('throws exception with custom message from AuthResponse', async () => {
        Gate.policy(Post, PostPolicy);

        await assert.rejects(
            async () => await Gate.forUser(user).authorize('delete', otherPost),
            (err: any) => {
                assert.strictEqual(err.message, 'You do not own this post.');
                assert.strictEqual(err.code, 'POST_NOT_OWNED');
                return true;
            }
        );
    });

    // ── Feature 5: Request-Scoped Context ───────────────────────────

    it('AuthorizationContext provides isolated per-request checks', async () => {
        Gate.define('edit-post', (user, post) => user.id === post.userId);

        const ctx1 = new AuthorizationContext(user);
        const ctx2 = new AuthorizationContext(adminUser);

        const can1 = await ctx1.can('edit-post', post);
        assert.strictEqual(can1, true);

        const can2 = await ctx2.can('edit-post', post);
        assert.strictEqual(can2, false); // adminUser.id !== post.userId
    });

    it('AuthorizationContext caches results within a request', async () => {
        let callCount = 0;
        Gate.define('counted-gate', (user) => {
            callCount++;
            return true;
        });

        const ctx = new AuthorizationContext(user);

        await ctx.can('counted-gate');
        await ctx.can('counted-gate'); // should be cached

        assert.strictEqual(callCount, 1); // Only called once
    });

    // ── Feature 1: Role & Permission ────────────────────────────────

    it('checks roles via RolePermissionMixin', () => {
        assert.strictEqual(RolePermissionMixin.hasRole(user, 'editor'), true);
        assert.strictEqual(RolePermissionMixin.hasRole(user, 'admin'), false);

        assert.strictEqual(RolePermissionMixin.hasAnyRole(adminUser, ['admin', 'super-admin']), true);
        assert.strictEqual(RolePermissionMixin.hasAllRoles(adminUser, ['admin', 'editor']), true);
        assert.strictEqual(RolePermissionMixin.hasAllRoles(adminUser, ['admin', 'super-admin']), false);
    });

    it('checks permissions via RolePermissionMixin', () => {
        assert.strictEqual(RolePermissionMixin.hasPermission(user, 'view-posts'), true);
        assert.strictEqual(RolePermissionMixin.hasPermission(user, 'delete-posts'), false);

        assert.strictEqual(RolePermissionMixin.hasAnyPermission(adminUser, ['edit-posts', 'nuke-server']), true);
        assert.strictEqual(RolePermissionMixin.hasAllPermissions(adminUser, ['view-posts', 'edit-posts', 'delete-posts']), true);
    });

    it('checks roles/permissions via AuthorizationContext', () => {
        const ctx = new AuthorizationContext(adminUser);

        assert.strictEqual(ctx.hasRole('admin'), true);
        assert.strictEqual(ctx.hasAnyRole(['admin', 'super-admin']), true);
        assert.strictEqual(ctx.hasPermission('edit-posts'), true);
        assert.strictEqual(ctx.hasAllPermissions(['view-posts', 'edit-posts']), true);
    });

    // ── AuthorizationManager ────────────────────────────────────────

    it('AuthorizationManager delegates to context', async () => {
        Gate.define('edit-post', (user, post) => user.id === post.userId);

        const authz = new AuthorizationManager(user);

        const can = await authz.can('edit-post', post);
        assert.strictEqual(can, true);

        const cannot = await authz.cannot('edit-post', otherPost);
        assert.strictEqual(cannot, true);

        assert.strictEqual(authz.hasRole('editor'), true);
        assert.strictEqual(authz.hasPermission('view-posts'), true);
    });
});
