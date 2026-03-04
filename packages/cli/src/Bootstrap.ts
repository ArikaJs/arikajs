import { CommandRegistry } from '@arikajs/console';
import { ApplicationLoader } from './ApplicationLoader';
import { NewCommand } from './Commands/NewCommand';
import { ListCommand } from './Commands/ListCommand';
import { ServeCommand } from './Commands/ServeCommand';
import { KeyGenerateCommand } from './Commands/KeyGenerateCommand';

export class Bootstrap {
    public static async boot(): Promise<CommandRegistry> {
        const registry = new CommandRegistry();

        // Core commands
        registry.register(NewCommand);
        registry.register(ListCommand);
        registry.register(ServeCommand);
        registry.register(KeyGenerateCommand);
        registry.registerLazy('docs:generate', 'Generate API documentation, Postman collection, and OpenAPI spec', () => import('./Commands/DocsGenerateCommand'));
        registry.registerLazy('route:list', 'List all registered routes', () => import('./Commands/RouteListCommand'));

        // Database-related commands (Lazy-loaded)
        registry.registerLazy('migrate', 'Run the database migrations', () => import('./Commands/MigrateCommand'));
        registry.registerLazy('migrate:fresh', 'Drop all tables and re-run all migrations', () => import('./Commands/MigrateFreshCommand'));
        registry.registerLazy('migrate:rollback', 'Rollback the last database migration', () => import('./Commands/MigrateRollbackCommand'));
        registry.registerLazy('make:migration {name}', 'Create a new migration file', () => import('./Commands/MakeMigrationCommand'));
        registry.registerLazy('make:seeder {name}', 'Create a new seeder file', () => import('./Commands/MakeSeederCommand'));
        registry.registerLazy('db:seed {--class=}', 'Seed the database with records', () => import('./Commands/DbSeedCommand'));
        registry.registerLazy('queue:table', 'Create a migration for the queue jobs database table', () => import('./Commands/QueueTableCommand'));
        registry.registerLazy('cache:table', 'Create a migration for the cache database table', () => import('./Commands/CacheTableCommand'));

        // Scheduler commands
        registry.registerLazy('schedule:run', 'Run the scheduled tasks', () => import('./Commands/ScheduleRunCommand'));
        registry.registerLazy('schedule:work', 'Start the scheduler worker', () => import('./Commands/ScheduleWorkCommand'));

        // Generator commands
        registry.registerLazy('make', 'Interactive menu to generate application boilerplate', () => import('./Commands/MakeCommand'));
        registry.registerLazy('make:command {name}', 'Create a new Artisan command', () => import('./Commands/MakeCommandCommand'));
        registry.registerLazy('make:provider {name}', 'Create a new service provider', () => import('./Commands/MakeProviderCommand'));
        registry.registerLazy('make:middleware {name}', 'Create a new middleware class', () => import('./Commands/MakeMiddlewareCommand'));
        registry.registerLazy('make:model {name} {--migration} {--controller} {--mc}', 'Create a new Eloquent model', () => import('./Commands/MakeModelCommand'));
        registry.registerLazy('make:controller {name}', 'Create a new controller class', () => import('./Commands/MakeControllerCommand'));
        registry.registerLazy('make:event {name}', 'Create a new event class', () => import('./Commands/MakeEventCommand'));
        registry.registerLazy('make:listener {name}', 'Create a new event listener class', () => import('./Commands/MakeListenerCommand'));
        registry.registerLazy('make:job {name}', 'Create a new job class', () => import('./Commands/MakeJobCommand'));
        registry.registerLazy('make:view {name}', 'Create a new Arika view template', () => import('./Commands/MakeViewCommand'));

        // Optimization & Environment Commands
        registry.registerLazy('env:validate', 'Validate the current .env against .env.example', () => import('./Commands/EnvValidateCommand'));
        registry.registerLazy('config:cache', 'Create a cache file for faster configuration loading', () => import('./Commands/ConfigCacheCommand'));
        registry.registerLazy('config:clear', 'Remove the configuration cache file', () => import('./Commands/ConfigClearCommand'));

        // Scaffolding & Setup Commands
        registry.registerLazy('auth:install', 'Interactive menu to scaffold authentication system', () => import('./Commands/AuthInstallCommand'));
        registry.registerLazy('auth:install:web', 'Scaffold web authentication views and routes (Session-based)', () => import('./Commands/AuthWebInstallCommand'));
        registry.registerLazy('auth:install:api', 'Scaffold API authentication routes (JWT-based)', () => import('./Commands/AuthApiInstallCommand'));

        const app = await ApplicationLoader.load();

        // In the future, this will discovery commands from @arikajs dependencies

        return registry;
    }
}
