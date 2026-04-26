
import { DeployCommand } from './Commands/DeployCommand';
import { LogsCommand } from './Commands/LogsCommand';
import { StatusCommand } from './Commands/StatusCommand';
import { RestartCommand } from './Commands/RestartCommand';
import { StopCommand } from './Commands/StopCommand';
import { RemoveCommand } from './Commands/RemoveCommand';
import { DoctorCommand } from './Commands/DoctorCommand';
import { HelpCommand } from './Commands/HelpCommand';
import { CommandRegistry } from './CommandRegistry';

export class Bootstrap {
    public static async boot(): Promise<CommandRegistry> {
        const registry = new CommandRegistry();

        registry.register(new DeployCommand());
        registry.register(new LogsCommand());
        registry.register(new StatusCommand());
        registry.register(new RestartCommand());
        registry.register(new StopCommand());
        registry.register(new RemoveCommand());
        registry.register(new DoctorCommand());
        registry.register(new HelpCommand(registry));

        return registry;
    }
}
