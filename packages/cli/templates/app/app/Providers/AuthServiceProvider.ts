import { ServiceProvider } from 'arikajs';
import { Gate } from '@arikajs/authorization';

export class AuthServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    public register(): void {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public boot(): void {
        // --- DEFINE POLICIES ---
        // Bind a Model to a Policy class to automatically authorize CRUD actions.
        //
        // Example:
        //   import { Post } from '@Models/Post';
        //   import { PostPolicy } from '@Policies/PostPolicy';
        //   Gate.policy(Post, PostPolicy);

        // --- DEFINE CUSTOM GATES ---
        // Define simple ability checks using a closure.
        // Return true to authorize, false to deny.
        //
        // Example:
        //   Gate.define('admin-only', (user) => {
        //       return user.is_admin === true;
        //   });
        //
        // Usage in controller: await Gate.allows('admin-only')
        // Usage in template:   @can('admin-only') ... @endcan
    }
}
