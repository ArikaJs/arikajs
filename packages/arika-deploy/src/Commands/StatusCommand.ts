
import { spawnSync } from 'child_process';
import type { ICommand } from '../CommandRegistry';

export class StatusCommand implements ICommand {
    public name = 'status';
    public description = 'Show the status of the deployed app';

    public async handle(_args: string[], _flags: Record<string, string | boolean>): Promise<void> {
        spawnSync('pm2', ['status'], { stdio: 'inherit', shell: true });
    }
}
