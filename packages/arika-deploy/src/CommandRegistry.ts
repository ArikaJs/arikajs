
export interface ICommand {
    name: string;
    description: string;
    handle(args: string[], flags: Record<string, string | boolean>): Promise<void>;
}

export class CommandRegistry {
    private commands: Map<string, ICommand> = new Map();

    public register(command: ICommand): void {
        this.commands.set(command.name, command);
    }

    public all(): Map<string, ICommand> {
        return this.commands;
    }

    public async run(args: string[]): Promise<void> {
        const commandName = args[0];
        const command = this.commands.get(commandName);

        if (!command) {
            console.error(`\x1b[31m❌ Unknown command: "${commandName}"\x1b[0m`);
            console.log(`\nRun \x1b[36marika-deploy help\x1b[0m to see all available commands.\n`);
            process.exit(1);
        }

        // Parse positional args and flags
        const positional: string[] = [];
        const flags: Record<string, string | boolean> = {};

        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith('--')) {
                const eqIndex = arg.indexOf('=');
                if (eqIndex !== -1) {
                    const key = arg.slice(2, eqIndex);
                    const value = arg.slice(eqIndex + 1);
                    flags[key] = value;
                } else {
                    // Check if next arg is a value (doesn't start with --)
                    const next = args[i + 1];
                    if (next && !next.startsWith('--')) {
                        flags[arg.slice(2)] = next;
                        i++; // skip next
                    } else {
                        flags[arg.slice(2)] = true;
                    }
                }
            } else {
                positional.push(arg);
            }
        }

        await command.handle(positional, flags);
    }
}
