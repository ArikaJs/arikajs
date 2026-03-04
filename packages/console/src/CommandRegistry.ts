
import { Command } from './Command';
import { Parser } from './Parser';
import { Input } from './Input';
import { Output } from './Output';

export class CommandRegistry {
    protected commands: Map<string, any> = new Map();
    protected resolver: (commandClass: any) => Command;
    protected container: any;

    constructor(resolver?: (commandClass: any) => Command) {
        this.resolver = resolver || ((cls) => new cls());
    }

    public setContainer(container: any) {
        this.container = container;
    }

    /**
     * Register a command class.
     */
    public register(command: any) {
        const instance = this.resolver(command);
        const { name } = Parser.parseSignature(instance.signature);
        this.commands.set(name, {
            class: command,
            signature: instance.signature,
            description: instance.description
        });
    }

    /**
     * Register a command lazily.
     */
    public registerLazy(signature: string, description: string, importer: () => Promise<any>) {
        const { name } = Parser.parseSignature(signature);
        this.commands.set(name, {
            isLazy: true,
            signature,
            description,
            importer
        });
    }

    public async run(rawArgs: string[]) {
        const commandName = rawArgs[0];
        const commandData = this.commands.get(commandName);

        if (!commandData) {
            throw new Error(`Command "${commandName}" not found.`);
        }

        let commandClass = commandData.class;

        if (commandData.isLazy) {
            const module = await commandData.importer();
            // Try to find the class in the module (default export or first exported class)
            commandClass = module.default || Object.values(module).find(v => typeof v === 'function');
        }

        if (!commandClass) {
            throw new Error(`Could not resolve command class for "${commandName}".`);
        }

        const command = this.resolver(commandClass);
        const signature = Parser.parseSignature(command.signature);
        const { arguments: args, options } = Parser.parseArguments(rawArgs.slice(1), signature);

        const input = new Input(args, options);
        const output = new Output();

        command.setInput(input);
        command.setOutput(output);
        command.setRegistry(this);

        if (this.container) {
            command.setContainer(this.container);
        }

        await command.initialize();

        return await command.handle();
    }

    public all() {
        return this.commands;
    }
}
