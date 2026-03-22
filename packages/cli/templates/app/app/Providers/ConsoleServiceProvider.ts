import { ServiceProvider, Command } from 'arikajs';
import { CommandRegistry } from '@arikajs/console';
import { ExampleCommand } from '@Console/Commands/ExampleCommand';

export class ConsoleServiceProvider extends ServiceProvider {
    /**
     * All the application's console commands.
     *
     * Register your custom commands here to make them available via the CLI.
     * Run any command with: node arika.js <command-signature>
     */
    protected commands: (new () => Command)[] = [
        ExampleCommand,
    ];

    public register(): void {
        //
    }

    public boot(): void {
        // If running in CLI context, register our commands with the registry
        if ((this.app as any).has(CommandRegistry)) {
            const registry = (this.app as any).make(CommandRegistry);
            for (const command of this.commands) {
                registry.register(command);
            }
        }
    }
}
